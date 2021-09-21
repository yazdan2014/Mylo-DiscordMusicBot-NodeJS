"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.is_expired = exports.RefreshToken = exports.Authorization = exports.sp_validate = exports.spotify = exports.extractID = exports.yt_validate = exports.stream_from_info = exports.stream = exports.search = exports.video_info = exports.video_basic_info = exports.playlist_info = void 0;
var YouTube_1 = require("./YouTube");
Object.defineProperty(exports, "playlist_info", { enumerable: true, get: function () { return YouTube_1.playlist_info; } });
Object.defineProperty(exports, "video_basic_info", { enumerable: true, get: function () { return YouTube_1.video_basic_info; } });
Object.defineProperty(exports, "video_info", { enumerable: true, get: function () { return YouTube_1.video_info; } });
Object.defineProperty(exports, "search", { enumerable: true, get: function () { return YouTube_1.search; } });
Object.defineProperty(exports, "stream", { enumerable: true, get: function () { return YouTube_1.stream; } });
Object.defineProperty(exports, "stream_from_info", { enumerable: true, get: function () { return YouTube_1.stream_from_info; } });
Object.defineProperty(exports, "yt_validate", { enumerable: true, get: function () { return YouTube_1.yt_validate; } });
Object.defineProperty(exports, "extractID", { enumerable: true, get: function () { return YouTube_1.extractID; } });
var Spotify_1 = require("./Spotify");
Object.defineProperty(exports, "spotify", { enumerable: true, get: function () { return Spotify_1.spotify; } });
Object.defineProperty(exports, "sp_validate", { enumerable: true, get: function () { return Spotify_1.sp_validate; } });
Object.defineProperty(exports, "Authorization", { enumerable: true, get: function () { return Spotify_1.Authorization; } });
Object.defineProperty(exports, "RefreshToken", { enumerable: true, get: function () { return Spotify_1.RefreshToken; } });
Object.defineProperty(exports, "is_expired", { enumerable: true, get: function () { return Spotify_1.is_expired; } });
const _1 = require(".");
function validate(url) {
    if (url.indexOf('spotify') !== -1) {
        let check = _1.sp_validate(url);
        if (check) {
            return "sp_" + check;
        }
        else
            return check;
    }
    else {
        let check = _1.yt_validate(url);
        if (check) {
            return "yt_" + check;
        }
        else
            return check;
    }
}
exports.validate = validate;
//# sourceMappingURL=index.js.map