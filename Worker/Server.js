import TOMP from '../TOMP.js';
import SyncServer from './SyncServer.js';
import register from './send.js';
import { openDB } from 'idb/with-async-ittr';
import { create_db as create_cookie_db } from './Cookies.js';
import { create_db as create_storage_db } from './Storage.js';
import { BareError } from './bare.js';

export default class Server {
	session = Math.random();
	constructor(config){
		config.origin = new URL(serviceWorker.scriptURL).origin;
		this.tomp = new TOMP(config);
		this.request = this.request.bind(this);
		this.ready = this.work();
		this.sync_request = new SyncServer(this);
		register(this);
	}
	async work(){
		this.db = await openDB('tomp', 1, {
			upgrade: (db, oldv, newv, transaction) => {
				const consts = db.createObjectStore('consts');

				create_cookie_db(db);
				create_storage_db(db);
			},
		});

		const tx = this.db.transaction('consts', 'readwrite');
		const store = tx.objectStore('consts');

		let key = await store.get('key');

		if(key === undefined){
			key = this.tomp.codec.generate_key();
		}

		this.tomp.key = key;

		await store.put(key, 'key');
		
		await tx.done;
	}
	on_message({ data }){
		if(this.sync_request.message(data)){
			return; // handled
		}
	}
	message(event){
		if(typeof event.data === 'object' && event.data.tomp === true){
			this.on_message(event);
			return true;
		}else{
			return false;
		}
	}
	json(status, json){
		// this.tomp.log.trace(json);
		
		return new Response(JSON.stringify(json, null, '\t'), {
			status,
			headers: {
				'content-type': 'application/json',
			},
		});
	}
	routes = new Map();
	async send(request, service, field){
		try{
			const route = this.routes.get(service);
				if(typeof route !== 'function'){
					throw new BareError(400, {
						code: 'IMPL_BAD_ROUTE',
						id: 'request',
						message: `Bad route for ${service}`,
					});
				}

				return await route(this, request, field);
		}catch(err){
			let status;
			let json;

			if(err instanceof Error){
				if(err instanceof BareError){
					status = err.status;
					json = err.body;
				}else{
					status = 500;
					json = {
						code: 'UNKNOWN',
						id: `error.${err.name}`,
						message: err.message,
						stack: err.stack,
					};
					this.tomp.log.error(err);
				}		
			}else{
				status = 500;
				json = {
					code: 'UNKNOWN',
					id: 'unknown',
					message: err,
					stack: new Error(err).stack,
				};
			}

			if(request.destination === 'document'){
				return new Response(`<!DOCTYPE HTML>
<html>
	<head>
		<meta charset='utf-8' />
		<title>Error</title>
	</head>
	<body>
		<h1>An error occurred. (${status})</h1>
		<hr />
		<p>Code: ${json.code}</p>
		<p>ID: ${json.id}</p>
		<p>Message: ${err.message}</p>
		${err.stack ? '<p>Stack trace:</p><pre>' + err.stack + '</pre>' : ''}
		<script>
const json = ${JSON.stringify(json)};
const error = new Error(json.message);
error.name = json.id;
error.code = json.code;
if(json.stack){
	error.stack = json.stack;
}
console.error(error);
		</script>
	</body>
</html>`, {
					status,
					headers: {
						'content-type': 'text/html',
					},
				});
			}else{
				return this.json(status, json);
			}
		}
	}
	request(event){
		const { request } = event;
		let url = request.url.slice(request.url.indexOf(this.tomp.directory));
		
		const hash = url.indexOf('#');
		
		if(hash != -1){
			url = url.slice(0, hash);
		}

		const {service,field} = this.tomp.url.get_attributes(url);
		
		if(this.routes.has(service)){
			event.respondWith(this.send(request, service, field));
			return true;
		}
		
		return false;
	}
};
