const {joinVoiceChannel , AudioPlayerStatus, VoiceConnectionStatus} = require("@discordjs/voice")

module.exports = {
    name : 'join',
    aliases:["j","biainjabache"],
    description: 'disconnects the bot from the vc',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Youre not in a channel")
        if(!channel.joinable)return message.channel.send("Bot doesn't have permission to join your voice channel")
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing && queue.get(message.guildId).resources.length !== 0) return message.channel.send("Mylo is currently being used in another voice channel")
        if(message.guild.me.voice.channelId == message.member.voice.channelId) return message.channel.send("Im already in your vc")
        var connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        }).on(VoiceConnectionStatus.Disconnected , ()=>{
            connection.destroy()
        })
    }
}