const {getVoiceConnection , AudioPlayerStatus} = require("@discordjs/voice")
const {MessageEmbed} = require("discord.js")

module.exports = {
    name : 'nowplaying',
    aliases:["np" , "current"],
    description: 'sends a message including the description of the current song',
    execute(message , client, queue, arg){
        var currentTime = new Date()
        var connection = getVoiceConnection(message.guildId)

        if(!connection ) return message.channel.send("Im not in a voice channel").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status != AudioPlayerStatus.Playing) return message.channel.send("Nothing is being played").catch(()=>{})
        
        var currentAudioRes = connection.state.subscription.player.state.resource

        if(!currentAudioRes) return message.channel.send("Nothing is being played").catch(()=>{})

        function setCharAt(str,index,chr) {
            return str.substring(0,index) + chr + str.substring(index+1);
        }

        var outPut = '▬'.repeat(30)
        let duration = currentAudioRes.metadata.secDuration
        let current = Math.floor(((currentTime.getTime() - queue.get(message.guildId).timeMusicStarted.getTime() )/1000))
        if(currentAudioRes.metadata.is_seeked){
            current += currentAudioRes.metadata.seekVal
        }
        let y = ((current/duration)*30).toFixed(0)-1
        outPut = setCharAt(outPut , y , "🔘")
        var embed = new MessageEmbed()
            .setColor('#1202F7')
            .setAuthor('NowPlaying🎵' , client.user.avatarURL())
            .setTitle(currentAudioRes.metadata.title)
            .setURL(currentAudioRes.metadata.url)
            .setDescription('`'+ outPut +'`')
            .setThumbnail(currentAudioRes.metadata.thumbnail)
            .addFields(
                { name: 'time:', value: '`'+ secToMinSec(current) +'/'+ currentAudioRes.metadata.rawDuration + '`' },
                { name: 'Requested by:', value: "`"+currentAudioRes.metadata.requestedBy+"`" ,inline:true},    
            )
            // .setFooter("By: **" + currentAudioRes.metadata.channel.name + "**" , currentAudioRes.metadata.channel.icon.url)
        message.channel.send({embeds:[embed]}).catch(()=>{})
    }
}