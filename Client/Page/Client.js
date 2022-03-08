import { SyncClient } from './Modules/SyncClient.js';
import { Reflect } from '../rewriteUtil.js';
import Client from '../Client.js';
import HistoryRewrite from './Modules/History.js';
import DOMRewrite from './Modules/DOM.js';
import StorageRewrite from './Modules/Storage.js';
import CookieRewrite from './Modules/Cookie.js';
import PageRequestRewrite from './Modules/PageRequest.js';
import IFrameRewrite from './Modules/IFrame.js';
import WindowRewrite from './Modules/Window.js';
import IsolateModule from './Modules/Isolate.js';

export default class PageClient extends Client {
	static type = 'page';
	#baseURI_desc = Reflect.getOwnPropertyDescriptor(Node.prototype, 'baseURI');
	get #baseURI(){
		return Reflect.apply(this.#baseURI_desc.get, document, []);
	}
	get base(){
		return this.tomp.url.parse_url(this.tomp.url.unwrap_ez(this.#baseURI));
	}
	get host(){
		return this.tomp.url.parse_url(this.#baseURI);
	}
	constructor(config){
		super(config);
		
		for(let node of document.querySelectorAll('[data-is-tomp]')){
			node.remove();
		}

		this.load_modules(
			SyncClient,
			HistoryRewrite,
			StorageRewrite,
			DOMRewrite,
			CookieRewrite,
			PageRequestRewrite,
			WindowRewrite,
			IFrameRewrite,
			IsolateModule,
		);
	}
};