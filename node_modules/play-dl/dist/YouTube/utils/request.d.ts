/// <reference types="node" />
import { RequestOptions } from 'https';
import { IncomingMessage } from 'http';
interface RequestOpts extends RequestOptions {
    body?: string;
    method?: "GET" | "POST";
}
export declare function request(url: string, options?: RequestOpts): Promise<string>;
export declare function request_stream(url: string, options?: RequestOpts): Promise<IncomingMessage>;
export {};
//# sourceMappingURL=request.d.ts.map