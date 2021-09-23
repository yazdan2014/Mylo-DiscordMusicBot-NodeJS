const { Client , MessageEmbed } = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const play = require("play-dl")
const changeSeek = require("./ffmpeg")
const numToEmoji = require("number-to-emoji")

const queue = new Map()
//Global queue for your bot. Every server will have a key and value pair in this map. { guild.id, queue_constructor{resources{} ,nowplayingdate } }


client.once('ready', () => {
	console.log('Ready!')
});

client.on("messageCreate", async message => {
    let prefix = "-"
    let commandWithPrefix = message.content.split(" ")[0]
    let command = commandWithPrefix.slice(1 , commandWithPrefix.length)

    if (message.author.equals(client.user)) return;
    if (!message.content.startsWith(prefix)) return;

    switch (command) {
        case "dc":
            var connection = getVoiceConnection(message.guildId)
            if(!connection) return message.channel.send("Im not in a channel")
            if(!message.member.voice.channel) return message.channel.send("Youre not in a voice channel")
            if(message.guild.me.voice.channelId != message.member.voice.channelId) return message.channel.send("Youre not in the same channel as bot is")
            connection.disconnect()
            break
        case "join":
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Youre not in a channel")
            if(message.guild.me.voice.channelId == message.member.voice.channelId) return message.channel.send("Im already in your vc")
            var connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            }).on(VoiceConnectionStatus.Disconnected, () =>{
                if(connection.state.subscription){
                    connection.state.subscription.player.stop()
                }
                queue.get(message.guildId).resources = []
                connection.destroy()
            })

            break;
        case "p":case "play":
            var query = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Join a channel")
            if(!query) return message.channel.send("Search for an actuall song")
                
            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)
            var result = await play.search(query , { limit : 1 })

            if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than ``1 hour`` buy premium nigger")

            var stream = await play.stream(result[0].url)
            var data = await play.video_info(result[0].url)
            
            const audioResource = createAudioResource(stream.stream,{
                inputType : stream.type,
                metadata:{
                    title: result[0].title,
                    url: result[0].url,
                    thumbnail: result[0].thumbnail.url,
                    guildId: message.guildId,
                    secDuration: result[0].durationInSec,
                    rawDuration: result[0].durationRaw,
                    requestedBy: message.author.username,
                    data: data ,//used for the seek option
                    is_seeked:false
                }
            })
            var connection
            if(!getVoiceConnection(message.guildId)){
                connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                }).on(VoiceConnectionStatus.Disconnected, () =>{
                    if(connection.state.subscription){
                        connection.state.subscription.player.stop()
                    }
                    queue.get(message.guildId).resources = []
                    connection.destroy()
                })
            }else{
                connection = getVoiceConnection(message.guildId)
            }

            var guild_queue = queue.get(message.guildId)

            if(!guild_queue){
                console.log("creating a queue")
                const queue_constructor = {
                    voice_channel: channel,
                    resources: [audioResource],
                    timeMusicStarted: null
                }
                queue.set(message.guildId , queue_constructor)
                playSong(message , connection)

            }else if(guild_queue && guild_queue.resources.length!== 0){
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
                
                const embed = new MessageEmbed()
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
            }else if(guild_queue && guild_queue.resources.length == 0){
                console.log("playing a song after queue creation")
                queue.get(message.guildId).resources.push(audioResource)
                playSong(message , connection)
            }
            break
        case 'np':
        var currentTime = new Date()
        var connection = getVoiceConnection(message.guildId)

        if(!connection ) return message.channel.send("Im not in a voice channel")
        if(!connection.state.subscription) return message.channel.send("Nothing is being played")
        
        var currentAudioRes = connection.state.subscription.player.state.resource

        if(!currentAudioRes) return message.channel.send("Nothing is being played")

        function setCharAt(str,index,chr) {
            return str.substring(0,index) + chr + str.substring(index+1);
        }
        var outPut = '▬'.repeat(30)
        let duration = currentAudioRes.metadata.secDuration
        let current = Math.floor(((currentTime.getTime() - queue.get(message.guildId).timeMusicStarted.getTime() )/1000))
        console.log("gets here")
        if(currentAudioRes.metadata.is_seeked){
            current += currentAudioRes.metadata.seekVal
        }
        y = ((current/duration)*30).toFixed(0)-1
        outPut = setCharAt(outPut , y , "🔘")
        const embed = new MessageEmbed()
            .setColor('#1202F7')
            .setAuthor('NowPlaying🎵' , client.user.avatarURL())
            .setTitle(currentAudioRes.metadata.title)
            .setURL(currentAudioRes.metadata.url)
            .setDescription('`'+ outPut +'`')
            .setThumbnail(currentAudioRes.metadata.thumbnail)
            .addFields(
                { name: 'time:', value: '`'+ secToMinSec(current) +'/'+ currentAudioRes.metadata.rawDuration + '`' },
                { name: '`Requested by:`', value: currentAudioRes.metadata.requestedBy ,inline:true},    
            )
        message.channel.send({embeds:[embed]})
        break
        case "skip":case "s":
            var connection = getVoiceConnection(message.guildId)
            if(queue.get(message.guildId).resources.length > 1){
                queue.get(message.guildId).resources.shift()
                playSong(message , connection)
            }else if(queue.get(message.guildId).resources.length == 1 ){
                connection.state.subscription.player.stop()
                message.react("✅")
            }
            else{
                message.channel.send("Nothing is being played")
            }
        break
        case "seek":
            var connection = getVoiceConnection(message.guildId)

            if(!connection ) return message.channel.send("Im not in a voice channel")
            if(!connection.state.subscription) return message.channel.send("Nothing is being played")
            
            var currentAudioRes = connection.state.subscription.player.state.resource
    
            if(!currentAudioRes) return message.channel.send("Nothing is being played")

            var seekVal = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            if(!(seekVal && (/^\d+$/.test(seekVal) || /^[0-5]?[0-9]:[0-5]?[0-9]$/.test(seekVal)))) return message.channel.send("Please choose a correct NATURAL NUMERIC seek value")
            var seekValFinal = 0

            if(seekVal.includes(":")){
                seekValFinal += parseInt(seekVal.split(":")[0]) * 60 + parseInt(seekVal.split(":")[1])
            }else{
                seekValFinal = parseInt(seekVal)
            }

            if(seekValFinal <= 0 || seekValFinal >= parseInt(currentAudioRes.metadata.secDuration)) return message.channel.send("Please choose a correct value between ``0 to " + currentAudioRes.metadata.secDuration + "`` or ``"+ currentAudioRes.metadata.rawDuration + "``" )
            console.log(seekValFinal , currentAudioRes.metadata.secDuration)

            var data = currentAudioRes.metadata.data
            var player = connection.state.subscription.player
            var ffmpegInstance = changeSeek(seekValFinal.toString(), data.format[0].url)
            var resource = createAudioResource(ffmpegInstance, {
                inputType : StreamType.OggOpus,
                metadata:{
                    title: currentAudioRes.metadata.title,
                    url: currentAudioRes.metadata.url,
                    thumbnail: currentAudioRes.metadata.thumbnail,
                    guildId: currentAudioRes.metadata.guildId,
                    secDuration: currentAudioRes.metadata.secDuration,
                    rawDuration: currentAudioRes.metadata.rawDuration,
                    requestedBy: currentAudioRes.metadata.requestedBy,
                    data: currentAudioRes.metadata.data,//used for the seek option
                    is_seeked:true,
                    seekVal: seekValFinal
                }
             })
            player.play(resource)
            break
        case "search":
            var query = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Join a channel")
            if(!query) return message.channel.send("Search for an actuall song")
                
            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)
            var results = await play.search(query , { limit : 20 })
            
            results = results.slice(0, 5)
            var output = ""

            results.forEach(function(result , i) {
                output += numToEmoji.toEmoji(i) + result.title + "\n\n"
            })
            message.channel.send("```"+ output + "```")
            // if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than ``1 hour`` buy premium nigger")
            // var stream = await play.stream(result[0].url)
            // var data = await play.video_info(result[0].url)
            break
        }

});


function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}

function playSong(message , connection){
    const player = createAudioPlayer({
        behaviors:{
            noSubscriber: NoSubscriberBehavior.Play
        }
    })

    player.on(AudioPlayerStatus.Playing, () => {
        if(!player.state.resource.metadata.is_seeked){
            message.channel.send("<:YT:890526793625391104>**Playing** " + "`" + queue.get(message.guildId).resources[0].metadata.title + "`")
            
        }else{
            message.channel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`)
        }
        queue.get(message.guildId).timeMusicStarted = new Date()
    });

    player.on('error', error => {
        console.log(`Error: ${error} with resource`);
        message.channel.send("Something went wrong");
    });

    player.on(AudioPlayerStatus.Idle , () => {
        console.log("idle")
        queue.get(message.guildId).resources.shift()
        if(queue.get(message.guildId).resources.length !== 0){
            playSong(message , connection)
        }
    })
    player.play(queue.get(message.guildId).resources[0])
    connection.subscribe(player)
}

client.login("ODg4NDMxOTg3OTE5MDI4MjQ0.YUSmxA.8qfgeCwsVVFf9DsNe0MqKMnwEhQ");