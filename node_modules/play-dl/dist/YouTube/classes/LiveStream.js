"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = exports.LiveStreaming = void 0;
const stream_1 = require("stream");
const stream_2 = require("../stream");
const request_1 = require("../utils/request");
const __1 = require("..");
class LiveStreaming {
    constructor(dash_url, target_interval, video_url) {
        this.type = stream_2.StreamType.Arbitrary;
        this.url = dash_url;
        this.base_url = '';
        this.stream = new stream_1.PassThrough({ highWaterMark: 10 * 1000 * 1000 });
        this.segments_urls = [];
        this.packet_count = 0;
        this.request = null;
        this.timer = null;
        this.video_url = video_url;
        this.interval = target_interval * 1000 || 0;
        this.dash_timer = setTimeout(() => {
            this.dash_updater();
        }, 1800000);
        this.stream.on('close', () => {
            this.cleanup();
        });
        this.start();
    }
    async dash_updater() {
        let info = await __1.video_info(this.video_url);
        if (info.LiveStreamData.isLive === true && info.LiveStreamData.hlsManifestUrl !== null && info.video_details.durationInSec === '0') {
            this.url = info.LiveStreamData.dashManifestUrl;
        }
        this.dash_timer = setTimeout(() => {
            this.dash_updater();
        }, 1800000);
    }
    async dash_getter() {
        let response = await request_1.request(this.url);
        let audioFormat = response.split('<AdaptationSet id="0"')[1].split('</AdaptationSet>')[0].split('</Representation>');
        if (audioFormat[audioFormat.length - 1] === '')
            audioFormat.pop();
        this.base_url = audioFormat[audioFormat.length - 1].split('<BaseURL>')[1].split('</BaseURL>')[0];
        let list = audioFormat[audioFormat.length - 1].split('<SegmentList>')[1].split('</SegmentList>')[0];
        this.segments_urls = list.replace(new RegExp('<SegmentURL media="', 'g'), '').split('"/>');
        if (this.segments_urls[this.segments_urls.length - 1] === '')
            this.segments_urls.pop();
    }
    cleanup() {
        var _a, _b;
        clearTimeout(this.timer);
        clearTimeout(this.dash_timer);
        (_a = this.request) === null || _a === void 0 ? void 0 : _a.unpipe(this.stream);
        (_b = this.request) === null || _b === void 0 ? void 0 : _b.destroy();
        this.dash_timer = null;
        this.video_url = '';
        this.request = null;
        this.timer = null;
        this.url = '';
        this.base_url = '';
        this.segments_urls = [];
        this.packet_count = 0;
        this.interval = 0;
    }
    async start() {
        if (this.stream.destroyed) {
            this.cleanup();
            return;
        }
        await this.dash_getter();
        if (this.segments_urls.length > 3)
            this.segments_urls.splice(0, this.segments_urls.length - 3);
        if (this.packet_count === 0)
            this.packet_count = Number(this.segments_urls[0].split('sq/')[1].split('/')[0]);
        for await (let segment of this.segments_urls) {
            if (Number(segment.split('sq/')[1].split('/')[0]) !== this.packet_count) {
                continue;
            }
            await new Promise(async (resolve, reject) => {
                let stream = await request_1.request_stream(this.base_url + segment);
                this.request = stream;
                stream.pipe(this.stream, { end: false });
                stream.on('end', () => {
                    this.packet_count++;
                    resolve('');
                });
                stream.once('error', (err) => {
                    this.stream.emit('error', err);
                });
            });
        }
        this.timer = setTimeout(() => {
            this.start();
        }, this.interval);
    }
}
exports.LiveStreaming = LiveStreaming;
class Stream {
    constructor(url, type, duration, contentLength, video_url, cookie) {
        this.url = url;
        this.type = type;
        this.stream = new stream_1.PassThrough({ highWaterMark: 10 * 1000 * 1000 });
        this.bytes_count = 0;
        this.video_url = video_url;
        this.cookie = cookie;
        this.timer = setInterval(() => {
            this.retry();
        }, 7200 * 1000);
        this.per_sec_bytes = Math.ceil(contentLength / duration);
        this.content_length = contentLength;
        this.request = null;
        this.data_ended = false;
        this.playing_count = 0;
        this.stream.on('close', () => {
            this.cleanup();
        });
        this.stream.on('pause', () => {
            this.playing_count++;
            if (this.data_ended) {
                this.bytes_count = 0;
                this.per_sec_bytes = 0;
                this.cleanup();
                this.stream.removeAllListeners('pause');
            }
            else if (this.playing_count === 280) {
                this.playing_count = 0;
                this.loop();
            }
        });
        this.loop();
    }
    async retry() {
        let info = await __1.video_info(this.video_url, this.cookie);
        this.url = info.format[info.format.length - 1].url;
    }
    cleanup() {
        var _a, _b;
        clearInterval(this.timer);
        (_a = this.request) === null || _a === void 0 ? void 0 : _a.unpipe(this.stream);
        (_b = this.request) === null || _b === void 0 ? void 0 : _b.destroy();
        this.timer = null;
        this.request = null;
        this.url = '';
    }
    async loop() {
        if (this.stream.destroyed) {
            this.cleanup();
            return;
        }
        let end = this.bytes_count + this.per_sec_bytes * 300;
        let stream = await request_1.request_stream(this.url, {
            headers: {
                "range": `bytes=${this.bytes_count}-${end >= this.content_length ? '' : end}`
            }
        });
        if (Number(stream.statusCode) >= 400) {
            this.cleanup();
            await this.retry();
            this.loop();
            if (!this.timer) {
                this.timer = setInterval(() => {
                    this.retry();
                }, 7200 * 1000);
            }
            return;
        }
        this.request = stream;
        stream.pipe(this.stream, { end: false });
        stream.once('error', (err) => {
            this.stream.emit('error', err);
        });
        stream.on('data', (chunk) => {
            this.bytes_count += chunk.length;
        });
        stream.on('end', () => {
            if (end >= this.content_length)
                this.data_ended = true;
        });
    }
}
exports.Stream = Stream;
//# sourceMappingURL=LiveStream.js.map