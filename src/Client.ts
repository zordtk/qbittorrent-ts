import * as http from 'http';
import * as https from 'https';
import {URL} from 'url';
import {ConnectOptions} from "./Types/Core";
import {AppBuildInfo, PreferencesTypes, TorrentListOptions, Torrent} from "./Types/qBT";
import FormData = require("form-data");

const API_ENDPOINT = '/api/v2';

type RequestData = number | string | string[] | any;

export class Client {
	// mClient: http.ClientRequest;
	mClientOpts: ConnectOptions;
	mCookie = '';

	private constructor(opts: ConnectOptions) {
		this.mClientOpts = opts;
		// this.mClient = client;
	}

	static async connect(opts: ConnectOptions): Promise<Client> {
		let client = new Client(opts);
		const response = await client.sendRequest('/auth/login', new Map([['username', opts.username], ['password', opts.password]]));
		if( response === 'Ok.' )
			return(client);
		else
			throw(new Error('Failed to login'));
	}

	public async getVersion(): Promise<string> {
		const response = await this.sendRequest('/app/version');
		return(response);
	}

	public async getWebapiVersion(): Promise<string> {
		const response = await this.sendRequest('/app/webapiVersion');
		return(response);
	}

	public async getBuildInfo(): Promise<AppBuildInfo> {
		const response = await this.sendRequest('/app/buildInfo');
		return (JSON.parse(response) as AppBuildInfo);
	}

	public async shutdown(){
		await this.sendRequest('/app/shutdown');
	}

	public async getPreferences(): Promise<Map<string,PreferencesTypes>> {
		const prefs = JSON.parse(await this.sendRequest('/app/preferences'));
		let map 	= new Map<string, PreferencesTypes>;
		const keys 	= Object.keys(prefs);
		for( const k of keys ) {
			const v = prefs[k];
			map.set(k, v);
		}
		return map;
	}

	public async setPreferences(values: Map<string,PreferencesTypes>) {
		await this.sendRequest('/app/setPreferences', new Map([['json', JSON.stringify(Object.fromEntries(values))]]));
	}

	public async getDefaultSavePath() {
		return await this.sendRequest('/app/getDefaultSavePath');
	}

	public async addTorrentByURL(url: string|string[]): Promise<boolean> {
		const formData = new FormData();
		formData.append('urls', (Array.isArray(url) ? url.join('\n') : url));
		if( await this.sendRequest('/torrents/add', formData) === 'Ok.' )
			return true;
		else
			return false;
	}

	public async getTorrents(opts?: TorrentListOptions) {
		let map = new Map<string, RequestData>();

		if( opts ) {
			if( opts.filter )		map.set('filter', opts.filter);
			if( opts.category )		map.set('category', opts.category);
			if( opts.hashes )		map.set('hashes', opts.hashes.join('|'));
			if( opts.limit )		map.set('limit', opts.limit);
			if( opts.offset )		map.set('offset', opts.offset);
			if( opts.reverse )		map.set('reverse', opts.reverse);
			if( opts.sort )			map.set('reverse', opts.sort);
			if( opts.tag )			map.set('reverse', opts.tag);
		
		}

		return JSON.parse(await this.sendRequest('/torrents/info', map)) as Torrent[];
	}

	private sendRequest(path: string, data: Map<string, RequestData>|FormData = new Map()): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let encodedData = '';
			const urlOpts 		= new URL(this.mClientOpts.uri);
			let requestOpts: http.RequestOptions = {
				host: urlOpts.hostname,
				protocol: urlOpts.protocol,
				port: urlOpts.port,
				path: `${API_ENDPOINT}${path}`,
				method: 'POST',
				headers: {
					Referer: urlOpts.origin,
					Origin: urlOpts.origin,
					Cookie: this.mCookie
				}
			};

			if( !(data instanceof FormData) && requestOpts.headers ) {
				encodedData 	= this.dictToUrlEncoded(data);

				requestOpts.headers['Content-Type'] 	= 'application/x-www-form-urlencoded';
				requestOpts.headers['Content-Length'] 	= encodedData.length;
			} else if( data instanceof FormData && requestOpts.headers ) {
				requestOpts.headers['Content-Type'] 	= data.getHeaders()['content-type'];
				requestOpts.headers['Content-Length'] 	= data.getLengthSync();
			}
			
			const protocolObj = {'http:': http.request, 'https:': https.request};
			
			if( urlOpts.protocol === 'http:' || urlOpts.protocol === 'https:') {
				const client = protocolObj[urlOpts.protocol](requestOpts, response => {
					let data: string[] = [];
					response.on('data', (chunk: string) => {
						data.push(chunk.toString());
					});

					response.on('end', () => {
						if( response.statusCode === 200 ) {
							if( response.headers['set-cookie'] )
								this.mCookie = response.headers['set-cookie'][0];
							resolve(data.join());
						} else {
							reject(new Error('HTTP Response: ' + response.statusCode));
						}
					});
				});

				client.write((data instanceof FormData ? data.getBuffer() : encodedData));
				client.end();
			}
		});
	}

	private dictToUrlEncoded(data: Map<string, RequestData>) {
		let encoded = '';
		let index = 0;
		for( const [key,value] of data ) {
			if( Array.isArray(value) )
				encoded += `${key}=${value.join('&')}`;
			else
				encoded += `${key}=${value}`;
			
			if( ++index > 0 && index < data.size )
				encoded += '&';
		}
		
		return encoded;
	}
}