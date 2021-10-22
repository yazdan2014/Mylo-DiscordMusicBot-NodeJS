const {MessageEmbed } = require("discord.js")
const {AudioPlayerStatus} = require("@discordjs/voice")

function queueSystem(queue , message , connection , audioResource){
    var guild_queue = queue.get(message.guildId)
    if((queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Paused || queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing || queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Buffering) &&  queue.get(message.guildId).resources.length != 0){
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
        queue.get(message.guildId).resources.push(audioResource)
        
        var embed = new MessageEmbed()
        .setColor('#00FFFF')
        .setAuthor(message.author.username , message.author.avatarURL())
        .setTitle(audioResource.metadata.video_details.title)
        .setURL(audioResource.metadata.video_details.url)
        .setThumbnail(audioResource.metadata.video_details.thumbnail.url)
        .addFields(
            { name: '**Duration**', value: audioResource.metadata.video_details.durationRaw  , inline :true},
            { name: '**Estimated time until playing**', value: secToMinSec(estimated) , inline:true },
            { name: '**Position in queue**', value: (guild_queue.resources.length-1).toString() , inline:true }
        )
        // .setFooter("By: **" + data.video_details.channel.name+ "**" , data.video_details.channel.iconURL())
        message.channel.send({embeds:[embed]}).catch(()=>{})
    }else if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle && queue.get(message.guildId).resources.length == 0){
        queue.get(message.guildId).resources.push(audioResource)
        var player = queue.get(message.guildId).audioPlayer
        player.play(audioResource)
    }else{
        message.channel.send("Sorry , something went wrong that caused a queue system crash.We will have to clear your songs in the queue\n. We'll try our best to fix this issue soon...\nThx for you support , Mylo team support").catch(()=>{})
        console.log(queue.get(message.guildId).audioPlayer)
        console.log(queue.get(message.guildId).audioPlayer.state.status)
        console.log(queue.get(message.guildId).resources)
        try{
            if(queue.get(message.guildId).resources.length > 0){
                queue.get(message.guildId).resources = []
            }
            queue.get(message.guildId).audioPlayer.stop(true);
        }catch{}
    }
}

module.exports = queueSystem

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}