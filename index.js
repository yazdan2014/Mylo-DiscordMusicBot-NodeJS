const { Client , MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });
const play = require("play-dl")
const changeSeek = require("./ffmpeg")
const {toEmoji} = require("number-to-emoji")

const queue = new Map()
//Global queue for your bot. Every server will have a key and value pair in this map. { guild.id, queue_constructor{resources{} ,nowplayingdate } }

client.once('ready', () => {
	console.log('Ready!')
    client.guilds.cache.forEach(guild => {
        var player = createAudioPlayer({
            behaviors:{
                noSubscriber: NoSubscriberBehavior.Stop
            }
        })
        console.log("creating a queue system map for " + guild.name)

        player.on(AudioPlayerStatus.Playing, () => {
            console.log("playing")
            var messageChannel = player.state.resource.metadata.messageChannel
            if(!player.state.resource.metadata.is_seeked){
                messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`")
                
            }else{
                messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`)
            }
            queue.get(guild.id).timeMusicStarted = new Date()
        });

        player.on('error', error => {
            console.log(`Error: ${error} with resource`);
            messageChannel.send("Something went wrong");
        })

        player.on(AudioPlayerStatus.Idle , () => {
            console.log("idle")
            var connection = getVoiceConnection(guild.id)
            if(!connection){
                queue.get(guild.id).resources = []
            }
            if(queue.get(guild.id).resources){
                queue.get(guild.id).resources.shift()
            }
            if(queue.get(guild.id).resources.length !== 0){
                playSong(messageChannel , connection)
            }
        })

        const queue_constructor = {
            resources: [],
            timeMusicStarted: null,
            audioPlayer: player
        }
        queue.set(guild.id , queue_constructor)
        
    })
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
            if(!channel.joinable)return message.channel.send("Bot doesn't have permission to join your voice channel")
            if(message.guild.me.voice.channelId == message.member.voice.channelId) return message.channel.send("Im already in your vc")
            var connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            }).on(VoiceConnectionStatus.Disconnected , ()=>{
                connection.destroy()
            })

            break;
        case "mame":case "play":
            var query = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Join a channel")
            if(!channel.joinable)return message.channel.send("Bot doesn't have permission to join your voice channel")
            if(!query) return message.channel.send("Search for an actuall song")
            
            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)
            var result = await play.search(query , { limit : 1 })
            console.log(result)
            if(result.length == 0) return message.channel.send("Couldn't find any result")
            if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than ``1 hour`` buy premium nigger")

            var connection
            if(!getVoiceConnection(message.guildId)){
                connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                }).on(VoiceConnectionStatus.Disconnected , ()=>{
                    connection.destroy()
                })
                console.log('doesnt exists')
            }else{
                connection = getVoiceConnection(message.guildId)
                console.log('exists')
            }

            var stream = await play.stream(result[0].url)
            var data = await play.video_info(result[0].url)
            
            const audioResource = createAudioResource(stream.stream,{
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
                    is_seeked:false
                }
            })


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
        var embed = new MessageEmbed()
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

            var data = currentAudioRes.metadata.data
            var player = connection.state.subscription.player
            var ffmpegInstance = changeSeek(seekValFinal.toString(), data.format[0].url)
            var resource = createAudioResource(ffmpegInstance, {
                inputType : StreamType.OggOpus,
                metadata:{
                    messageChannel: message.channel,
                    title: currentAudioRes.metadata.title,
                    url: currentAudioRes.metadata.url,
                    thumbnail: currentAudioRes.metadata.thumbnail,
                    guildId: currentAudioRes.metadata.guildId,
                    secDuration: currentAudioRes.metadata.secDuration,
                    rawDuration: currentAudioRes.metadata.rawDuration,
                    requestedBy: currentAudioRes.metadata.requestedBy,
                    data: currentAudioRes.metadata.data, //used for the seek option
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

            const row = new MessageActionRow()
            .addComponents(
				new MessageButton()
                    .setCustomId('previous')
					.setLabel('ᐊ')
					.setStyle('SECONDARY'),
			)
			.addComponents(
				new MessageButton()
                    .setCustomId('next')
					.setLabel('ᐅ')
					.setStyle('SECONDARY'),
			)
            .addComponents(
				new MessageButton()
                    .setCustomId('cancel')
					.setLabel('cancel')
					.setStyle('DANGER'),
			)

            var currentPage = 1
            var resultsRaw = await play.search(query , { limit : 20 })
            var results = splitArray(resultsRaw , 4)

            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)

            function createEmbbed(){
                var embedSearch = new MessageEmbed()
                .setColor('#1202F7')
                .setAuthor('Requested By ' + message.author.username , message.author.avatarURL())
                .setTitle("Send the numbers of your choice or use the cancel button")
                .setFooter(`Page ${currentPage}/4`)
                
                var outPut = ""
                results[currentPage-1].forEach(function(result , i) {
                    var finalResTitle 
                    if(result.title.length >= 60){
                        finalResTitle = result.title.substring(0 , 60) + "..."
                    }else{
                        finalResTitle = result.title
                    }
                    outPut += toEmoji(++i + 5*(currentPage-1)) + "`" + finalResTitle +"`"+ "\n"
                })
                embedSearch.setDescription(outPut)
                return embedSearch
            }
            var sentMessage = await message.channel.send({embeds:[createEmbbed()] ,components: [row]})

            var is_canceled = false
            var is_collected = false

            const messageFilter = m => m.user.id == message.author.id
            const mcollector = message.channel.createMessageCollector({ messageFilter ,max: 1, time: 30000 });

            const componnentFilter = i => i.user.id === message.author.id;
            const collector = message.channel.createMessageComponentCollector({ componnentFilter, time: 30000 });

            mcollector.on('collect', m => {
                console.log(`Collected ${m.content}`);
                is_collected = true
                mcollector.stop()
                collector.stop()
            });

            mcollector.on('end', collected => {
                if(collected.size == 0 && !is_canceled){
                    message.channel.send("Didn't recive any number")
                }
            });   

            collector.on("collect" , async collected =>{
                if(collected.customId == "cancel"){
                    await collected.update({ content: 'Search proccess canceled successfuly!', components: [], embeds:[] });
                    is_canceled = true
                    collector.stop()
                    mcollector.stop()
                }
                else if(collected.customId == "next"){
                    if (currentPage == results.length) return console.log("bruh")
                    currentPage++
                    await collected.update({embeds:[createEmbbed()]})
                }
                else if(collected.customId == "previous"){
                    if (currentPage == 1) return console.log("bruh")
                    currentPage--
                    await collected.update({embeds:[createEmbbed()]})
                }
            })
            collector.on("end" ,collector =>{
                if(!is_canceled && !is_collected){
                    sentMessage.edit({content: 'You ran out of time!', components: [], embeds:[]})
                }
            })  

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

function playSong(messageOrChannel , connection){    
    var player = queue.get(messageOrChannel.guildId).audioPlayer
    player.play(queue.get(messageOrChannel.guildId).resources[0])
    connection.subscribe(player)
}

function splitArray(flatArray, numCols){
    const newArray = []
    for (let c = 0; c < numCols; c++) {
      newArray.push([])
    }
    for (let i = 0; i < flatArray.length; i++) {
      const mod = i % numCols
      newArray[mod].push(flatArray[i])
    }
    return newArray
}
client.login("ODg4NDMxOTg3OTE5MDI4MjQ0.YUSmxA.8qfgeCwsVVFf9DsNe0MqKMnwEhQ");