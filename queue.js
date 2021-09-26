const {MessageEmbed} = require("discord.js")
function createQueueAndPlaySong(queue , message , connection , playSong , audioResource){
    var guild_queue = queue.get(message.guildId)
    if(guild_queue.resources.length!== 0){
        var currentAudioRes = connection.state.subscription.player.state.resource
        var currentTime = new Date().getTime()
        var timeMusicStarted = queue.get(message.guildId).timeMusicStarted.getTime()
        var timePassedFromMusic = ((currentTime - timeMusicStarted)/1000).toFixed(0)
        let estimated = -timePassedFromMusic
        queue.get(message.guildId).resources.forEach(r=>{
            estimated += r.metadata.secDuration
        })
        if(currentAudioRes.metadata.is_seeked){
            estimated += currentAudioRes.metadata.seekVal
        }
        console.log("queuing a song")
        queue.get(message.guildId).resources.push(audioResource)
        
        var embed = new MessageEmbed()
        .setColor('#00FFFF')
        .setAuthor(message.member.nickname , message.author.avatarURL())
        .setTitle(result[0].title)
        .setURL(result[0].url)
        .setThumbnail(result[0].thumbnail.url)
        .addFields(
            { name: '**Duration**', value: result[0].durationRaw  , inline :true},
            { name: '**Estimated time until playing**', value: secToMinSec(estimated) , inline:true },
            { name: '**Position in queue**', value: (guild_queue.resources.length-1).toString() , inline:true }
        )
        message.channel.send({embeds:[embed]})
    }else if(guild_queue.resources.length == 0){
        console.log("playing a song after queue creation")
        queue.get(message.guildId).resources.push(audioResource)
        playSong(message , connection)
    }
}

module.exports = createQueueAndPlaySong