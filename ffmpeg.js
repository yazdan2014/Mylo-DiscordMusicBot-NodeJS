const { FFmpeg } = require('prism-media')

function changeSeek(val, url){
    const FFMPEG_OPUS_ARGUMENTS = [
        '-analyzeduration','0',
        '-loglevel','0',
        '-acodec','libopus',
        '-f','opus',
        '-ar','48000',
        '-ac','2',
    ];
    
    let finalArgs = ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5' ,'-accurate_seek', '-ss', val ,'-i', url ,...FFMPEG_OPUS_ARGUMENTS]
    const ffmpegInstance = new FFmpeg({
            args: finalArgs,
        })

    return ffmpegInstance
}

module.exports = changeSeek