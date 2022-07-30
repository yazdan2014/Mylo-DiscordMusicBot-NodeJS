const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")

/**
 * @param queue @param message @param connection @param audioResource
 */
const queueFunc = require("../../Imports/queue")

play.getFreeClientID().then((clientID) => {
    play.setToken({
      soundcloud : {
          client_id : clientID
      }
    })
})

const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');

module.exports = {
    name : 'play',
    aliases:["p"],
    cooldown: 2,
    description: 'Plays the track with the given name as a query using YouTube search engine or using the given link \*Spotify , SoundCloud links work as well\*',
    async execute(message , client, queue, arg){
        var query = arg.replaceAll("#", "sharp")
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        try{
            if((message.member.voice.channel.id !== message.guild.me.voice.channel.id) && queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})
        }catch{}

        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!query) return message.channel.send("Search for an actuall song").catch(()=>{})

        if(!getVoiceConnection(message.guildId)){
            var connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            })            

        }else{
            var connection = getVoiceConnection(message.guildId)
        }

        if (queue.get(message.guildId).queueloopStatue)return message.channel.send("Queue loop is currently on , please turn it off before adding new songs to the queue")

        let check = await play.validate(query)
        switch(check){
            case "sp_playlist":
                if(play.is_expired()){
                    await play.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
                }
                message.channel.send("Please wait while your play list is being fetched ...")
                var playlist = await play.spotify(query)
                if(playlist.fetched_tracks.get("1").length > 25) return message.channel.send("Your playlist has more than 25 songs")      
                
                playlist.fetched_tracks.get("1").forEach(async (track) =>{
                    var res = await play.search(`${track.name} ${track.artists[0].name} `, { limit : 1 })
                    try{
                        var stream = await play.stream(res[0].url)
                    }catch(error){
                        console.log("error" + error)
                        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                        return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
                    }
                    
                    var audioResource = createAudioResource(stream.stream,{
                        inputType : stream.type,
                        metadata:{
                            messageChannel:message.channel,
                            title: track.name,
                            url: track.url,
                            thumbnail: track.thumbnail.url,
                            guildId: message.guildId,
                            secDuration: res[0].durationInSec,
                            rawDuration: res[0].durationRaw,
                            requestedBy: message.author.username,
                            is_seeked:false,
                            channel: res[0].channel.name,
                            type: "sp"                        
                        }
                    })
 
                    queue.get(message.guildId).resources.push(audioResource)
                    if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ){
                        await queue.get(message.guildId).audioPlayer.play(queue.get(message.guildId).resources[0])
                    }
                })

                break
            case "sp_track":
                if(play.is_expired()){
                    await play.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
                }
                var sp_data = await play.spotify(arg) // This will get spotify data from the url [ I used track url, make sure to make a logic for playlist, album ]
                var result = await play.search(`${sp_data.name} ${sp_data.artists[0].name} `, { limit : 1 }) // This will search the found track on youtube.

                try{
                    var data = await play.video_info(result[0].url)
                    var stream = await play.stream(result[0].url)
                }catch(error){
                    console.log("error" + error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                    return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
                }

                var audioResource = createAudioResource(stream.stream,{
                    inputType : stream.type,
                    metadata:{
                        messageChannel:message.channel,
                        title: sp_data.name,
                        url: sp_data.url,
                        thumbnail: sp_data.thumbnail.url,
                        guildId: message.guildId,
                        secDuration: data.video_details.durationInSec,
                        rawDuration: data.video_details.durationRaw,
                        requestedBy: message.author.username,
                        data: data ,//used for the seek option
                        is_seeked:false,
                        channel: data.video_details.channel,
                        type: "sp"                        
                    }
                })
                if(connection.state.status == VoiceConnectionStatus.Ready){
                    await entersState(connection , VoiceConnectionStatus.Ready , 10_000).catch(() =>{
                        return message.channel.send("Something went wrong please try again").catch(()=>{})
                    })
                }
                queueFunc(queue , message, connection , audioResource)
                break
            case "search":case "yt_video":
                if(check == "search"){
                    message.channel.send(`**Searching...**🔎 \`\`${query}\`\``).catch(()=>{})
                    var result = await play.search(query , { limit : 1 })
                    if(result.length == 0) return message.channel.send("Couldn't find any result").catch(()=>{})
                    if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than `1 hour`").catch(()=>{})
                }else{
                    var data = await play.video_info(query , { limit : 1 })
                }
                
                try{
                    if(!data){
                        var data = await play.video_info(result[0].url)
                        var stream = await play.stream(result[0].url)
                    }else{
                        var stream = await play.stream(data.video_details.url)
                    }
                }catch(error){
                    console.log("error" + error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                    return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
                }
                
                var audioResource = createAudioResource(stream.stream,{
                    inputType : stream.type,
                    metadata:{
                        messageChannel:message.channel,
                        title: data.video_details.title,
                        url: data.video_details.url,
                        thumbnail: data.video_details.thumbnails[0].url,
                        guildId: message.guildId,
                        secDuration: data.video_details.durationInSec,
                        rawDuration: data.video_details.durationRaw,
                        requestedBy: message.author.username,
                        data: data ,//used for the seek option
                        is_seeked:false,
                        channel: data.video_details.channel,
                        type:"yt"
                    }
                })
                
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
                    .setColor('#00AFF4')
                    .setAuthor(message.author.username , message.author.avatarURL())
                    .setTitle(data.video_details.title)
                    .setURL(data.video_details.url)
                    .setThumbnail(data.video_details.thumbnails[0].url)
                    .addFields(
                        { name: '**Duration**', value: data.video_details.durationRaw  , inline :true},
                        { name: '**Estimated time until playing**', value: secToMinSec(estimated) , inline:true },
                        { name: '**Position in queue**', value: (guild_queue.resources.length-1).toString() , inline:true }
                    )
                    console.log("\n.\n.\n." + data.video_details.channel.icon)
                    // .setFooter("By: **" + data.video_details.channel.name+ "**" , data.video_details.channel.iconURL())
                    message.channel.send({embeds:[embed]}).catch(()=>{})
                }else if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle && queue.get(message.guildId).resources.length == 0){
                    if(connection.state.status != VoiceConnectionStatus.Ready){
                        await entersState(connection , VoiceConnectionStatus.Ready , 10_000).catch(() =>{
                            return message.channel.send("Something went wrong please try again").catch(()=>{})
                        })
                    }
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
            break
            case "so_track":
                var so_info = await play.soundcloud(arg) 

                try{
                    var stream = await play.stream_from_info(so_info)
                }catch(error){
                    console.log("error" + error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                    return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
                }
                console.log(so_info)
                var audioResource = createAudioResource(stream.stream,{
                    inputType : stream.type,
                    metadata:{
                        messageChannel:message.channel,
                        title: so_info.name,
                        url: so_info.permalink,
                        thumbnail: so_info.thumbnail,
                        guildId: message.guildId,
                        secDuration: so_info.durationInSec,
                        rawDuration: secToMinSec(so_info.durationInSec),
                        requestedBy: message.author.username,
                        is_seeked:false,
                        channel: so_info.user.name,
                        type: "so"                        
                    }
                })
                if(connection.state.status == VoiceConnectionStatus.Ready){
                    await entersState(connection , VoiceConnectionStatus.Ready , 10_000).catch(() =>{
                        return message.channel.send("Something went wrong please try again").catch(()=>{})
                    })
                }
                queueFunc(queue , message, connection , audioResource)
            break
            default:
                message.channel.send("Please use a valid url")
            break
        }


    }
}

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}
