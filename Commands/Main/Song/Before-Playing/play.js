const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")
const queueFunc = require("./Commands/Main/Song/Before-Playing/Imports/queue")

const {MessageEmbed} = require("discord.js")

module.exports = {
    name : 'play',
    aliases:["p"],
    cooldown: 2,
    description: 'Plays the track with the given name as a query using YouTube search engine or using the given link \*Spotify , SoundCloud links work as well\*',
    execute(message , client, queue, arg){
        var query = arg
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        try{
            if((message.member.voice.channel.id !== message.guild.me.voice.channel.id) && queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})
        }catch{}

        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!query) return message.channel.send("Search for an actuall song").catch(()=>{})

        if(!getVoiceConnection(message.guildId)){
            let rawConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            })

            var connection = await entersState(rawConnection , VoiceConnectionStatus.Ready , 30_000).catch(() =>{
                return message.channel.send("Something went wrong please try again").catch(()=>{})
            })

        }else{
            var connection = getVoiceConnection(message.guildId)
        }

        message.channel.send(`**Searching...**🔎 \`\`${query}\`\``).catch(()=>{})

        var result = await play.search(query , { limit : 1 })
        if(result.length == 0) return message.channel.send("Couldn't find any result").catch(()=>{})
        console.log(result[0].channel)
        if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than ``1 hour``").catch(()=>{})

        try{
            var data = await play.video_info(result[0].url)
            var stream = await play.stream(result[0].url)
        }catch(error){
            console.log("error"+error)
            client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
            return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
        }

        var audioResource = createAudioResource(stream.stream,{
            inputType : stream.type,
            metadata:{
                messageChannel:message.channel,
                title: result[0].title,
                url: result[0].url,
                thumbnail: result[0].thumbnail.url,
                guildId: message.guildId,
                secDuration: result[0].durationInSec,
                rawDuration: result[0].durationRaw,
                requestedBy: message.author.username,
                data: data ,//used for the seek option
                is_seeked:false,
                channel:result[0].channel,
                streamData:stream
            }
        })

        var guild_queue = queue.get(message.guildId)
        if((queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Paused || queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing) &&  queue.get(message.guildId).resources.length != 0){
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
            .setTitle(result[0].title)
            .setURL(result[0].url)
            .setThumbnail(result[0].thumbnail.url)
            .addFields(
                { name: '**Duration**', value: result[0].durationRaw  , inline :true},
                { name: '**Estimated time until playing**', value: secToMinSec(estimated) , inline:true },
                { name: '**Position in queue**', value: (guild_queue.resources.length-1).toString() , inline:true }
            )
            .setFooter("By: **" + result[0].channel.name+ "**" , result[0].channel.icon.url)
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
}

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}