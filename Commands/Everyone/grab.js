const {getVoiceConnection , AudioPlayerStatus} = require("@discordjs/voice")
const {MessageEmbed} = require("discord.js")

module.exports = {
    name : 'grab',
    aliases:[],
    description: 'Sends the current playing song through direct messages',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        var connection = getVoiceConnection(message.guildId)
        if(!connection ) return message.channel.send("Im not in a voice channel").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status != AudioPlayerStatus.Playing) return message.channel.send("Nothing is being played").catch(()=>{})
        var currentAudioRes = connection.state.subscription.player.state.resource
        if(!currentAudioRes) return message.channel.send("Nothing is being played").catch(()=>{})

        let duration = currentAudioRes.metadata.rawDuration
        var embed = new MessageEmbed()
            .setColor('#1202F7')
            .setTitle(currentAudioRes.metadata.title)
            .setDescription(`Duration: ${duration}`)
            .setURL(currentAudioRes.metadata.url)
            .setThumbnail(currentAudioRes.metadata.thumbnail)
            try{
                message.author.send({embeds:[embed]}).catch()
            }catch(err){
                message.channel.send("Couldn't send you a dm")
            }
            
    }
}