"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const http = __importStar(require("http"));
const url_1 = require("url");
const API_ENDPOINT = '/api/v2';
class Client {
    constructor(opts) {
        this.mCookie = '';
        this.mClientOpts = opts;
        // this.mClient = client;
    }
    static connect(opts) {
        return new Promise((resolve, reject) => {
            let client = new Client(opts);
            client.sendRequest('/auth/login', new Map([['username', opts.username], ['password', opts.password]]));
            return client;
        });
    }
    sendRequest(path, data) {
        return new Promise((resolve, reject) => {
            const encodedData = this.dictToUrlEncoded(data);
            const urlOpts = new url_1.URL(this.mClientOpts.uri);
            let request = {
                host: urlOpts.host,
                protocol: urlOpts.protocol,
                port: urlOpts.port,
                path: `${API_ENDPOINT}/${path}`,
                method: 'POST',
                headers: {
                    Referer: this.mClientOpts.uri,
                    Origin: this.mClientOpts.uri,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': encodedData.length,
                    Cookie: this.mCookie
                }
            };
            if (urlOpts.protocol === 'http') {
                const client = new http.ClientRequest(urlOpts.toString(), (result => {
                    let data = [];
                    result.on('data', (chunk) => {
                        data.push(chunk);
                    });
                    result.on('end', () => {
                        if (result.statusCode === 200) {
                            console.log(result.headers);
                        }
                    });
                }));
            }
            /*'Referer': opt.protocol + '//' + opt.hostname + ((opt.port != 80 || opt.port != 443) ? ':' + opt.port : ''),
            'Origin': opt.protocol + '//' + opt.hostname + ((opt.port != 80 || opt.port != 443) ? ':' + opt.port : ''),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            // 'Cookie': cookie*/
            // if( url.protocol === 'http' ) {
            // 	const client = new http.ClientRequest(url, (res => {
            // 	}));
            // }
        });
    }
    dictToUrlEncoded(data) {
        let encoded = '';
        let index = 0;
        for (const key in data) {
            const value = data.get(key);
            if (Array.isArray(value))
                encoded += `${key}=${value.join('&')}`;
            else
                encoded += `${key}=${value}`;
            if (index++ > 0 && index < data.size)
                encoded += '&';
        }
        return encoded;
    }
}
exports.Client = Client;
Client.connect({ uri: 'http://108.163.143.90:8080', username: 'droz', password: 'bemepsa3' }).then(client => {
});
