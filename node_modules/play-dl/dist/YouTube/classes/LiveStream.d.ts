/// <reference types="node" />
import { PassThrough } from 'stream';
import { StreamType } from '../stream';
export interface FormatInterface {
    url: string;
    targetDurationSec: number;
    maxDvrDurationSec: number;
}
export declare class LiveStreaming {
    type: StreamType;
    stream: PassThrough;
    private base_url;
    private url;
    private interval;
    private packet_count;
    private timer;
    private video_url;
    private dash_timer;
    private segments_urls;
    private request;
    constructor(dash_url: string, target_interval: number, video_url: string);
    private dash_updater;
    private dash_getter;
    private cleanup;
    private start;
}
export declare class Stream {
    type: StreamType;
    stream: PassThrough;
    private url;
    private bytes_count;
    private per_sec_bytes;
    private content_length;
    private video_url;
    private timer;
    private cookie;
    private data_ended;
    private playing_count;
    private request;
    constructor(url: string, type: StreamType, duration: number, contentLength: number, video_url: string, cookie: string);
    private retry;
    private cleanup;
    private loop;
}
//# sourceMappingURL=LiveStream.d.ts.map