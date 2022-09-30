const {AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior , getVoiceConnection, entersState } = require('@discordjs/voice');
module.exports = function(queue, message, connection){
    queue.get(message.guildId).audioPlayer.removeAllListeners("stateChange")
}