import { CreateDataURI, ParseDataURI } from './DataURI.mjs'

export class Rewriter {
	static service = 'worker:unknown';
	constructor(tomp){
		this.tomp = tomp;
	}
	get overwrites_wrap(){
		return this.wrap !== Rewriter.prototype.wrap;
	}
	get overwrites_unwrap(){
		return this.unwrap !== Rewriter.prototype.unwrap;
	}
	serve(serve, url){
		serve = String(serve);
		
		if(serve.startsWith('data:')){
			if(!this.overwrites_wrap){
				return serve;
			}
			
			const {mime,data,base64} = ParseDataURI(serve);
			
			const wrapped = this.wrap(data, url);
			
			return CreateDataURI(mime, wrapped, base64);
		}

		return this.tomp.url.wrap(serve, this.constructor.service);
	}
	unwrap_serving(serving, url){
		serving = String(serving);

		if(serving.startsWith('data:')){
			if(!this.overwrites_wrap){
				return serving;
			}
			
			const {mime,data,base64} = ParseDataURI(serving);
			
			const unwrapped = this.unwrap(data, url);
			
			return CreateDataURI(mime, unwrapped, base64);
		}
		
		return this.tomp.url.unwrap_ez(serving);
	}
	wrap(code, url){
		return code;
	}
	unwrap(code, url){
		return code;
	}
};