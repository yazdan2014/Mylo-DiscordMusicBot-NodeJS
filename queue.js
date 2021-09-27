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
        .setTitle(audioResource.metadata.title)
        .setURL(audioResource.metadata.url)
        .setThumbnail(audioResource.metadata.thumbnail)
        .addFields(
            { name: '**Duration**', value: audioResource.metadata.rawDuration  , inline :true},
            { name: '**Estimated time until playing**', value: secToMinSec(estimated).toString() , inline:true },
            { name: '**Position in queue**', value: (guild_queue.resources.length-1).toString() , inline:true }
        )
        .setFooter("By ``" + audioResource.metadata.channel.name + "``" , audioResource.metadata.channel.icon.url)
        message.channel.send({embeds:[embed]})
    }else if(guild_queue.resources.length == 0){
        console.log("playing a song after queue creation")
        queue.get(message.guildId).resources.push(audioResource)
        playSong(message , connection)
    }
}

module.exports = createQueueAndPlaySong

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}