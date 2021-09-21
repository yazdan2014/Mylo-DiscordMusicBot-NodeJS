"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request_stream = exports.request = void 0;
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
async function https_getter(req_url, options = {}) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        let s = new url_1.URL(req_url);
        (_a = options.method) !== null && _a !== void 0 ? _a : (options.method = "GET");
        let req_options = {
            host: s.hostname,
            path: s.pathname + s.search,
            headers: (_b = options.headers) !== null && _b !== void 0 ? _b : {},
            method: options.method
        };
        let req = https_1.default.request(req_options, (response) => {
            resolve(response);
        });
        if (options.method === "POST")
            req.write(options.body);
        req.end();
    });
}
async function request(url, options) {
    return new Promise(async (resolve, reject) => {
        let data = '';
        let res = await https_getter(url, options);
        if (Number(res.statusCode) >= 300 && Number(res.statusCode) < 400) {
            res = await https_getter(res.headers.location, options);
        }
        else if (Number(res.statusCode) > 400) {
            reject(`Got ${res.statusCode} from the request`);
        }
        res.setEncoding('utf-8');
        res.on('data', (c) => data += c);
        res.on('end', () => resolve(data));
    });
}
exports.request = request;
async function request_stream(url, options) {
    return new Promise(async (resolve, reject) => {
        let res = await https_getter(url, options);
        if (Number(res.statusCode) >= 300 && Number(res.statusCode) < 400) {
            res = await https_getter(res.headers.location, options);
        }
        resolve(res);
    });
}
exports.request_stream = request_stream;
//# sourceMappingURL=request.js.map