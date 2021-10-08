const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
const arraySplitter = require("split-array")

const table = require('text-table');
const shuffle = require('shuffle-array')
const changeSeek = require("./ffmpeg")
const queueFunc = require("./queue")
const {toEmoji} = require("number-to-emoji");


client.commands = new Collection()
const fs = require('fs')
const commandFiles = fs.readdirSync('./Commands/Current/').filter(file => file.endsWith(".js"))
for(const file of commandFiles){
    const command = require(`./Commands/Current/${file}`)
    client.commands.set(command.name, command)
}

const queue = new Map()
//Global queue for your bot. Every server will have a key and value pair in this map. { guild.id , [queue_constructor{resources{} ,nowplayingdate] } }

client.once('ready', () => {
	console.log('Ready!')
    client.guilds.cache.forEach(guild => {
        var player = createAudioPlayer({
            behaviors:{
                noSubscriber: NoSubscriberBehavior.Stop
            }
        })
        console.log("creating a queue system map for " + guild.name)

        let timeOut = null

        player.on(AudioPlayerStatus.Playing, () => {
            clearTimeout(timeOut)
            var messageChannel = player.state.resource.metadata.messageChannel

            queue.get(guild.id).messageChannel = messageChannel
            if(!player.state.resource.metadata.is_seeked ){
                messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`")
            }else{
                messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`)
            }
            queue.get(guild.id).timeMusicStarted = new Date()
        });

        player.on('error', error => {
            var messageChannel = queue.get(guild.id).messageChannel
            console.log(`Error: ${error} with resource`);
            client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `)
            messageChannel.send("Something went wrong");
        })

        player.on(AudioPlayerStatus.Idle , async () => {
            let currentAudioRes = queue.get(guild.id).resources[0]
            var messageChannel = currentAudioRes.metadata.messageChannel

            var connection = getVoiceConnection(guild.id)        

            if(!connection){
                queue.get(guild.id).resources = []
            }else{
                timeOut = setTimeout(function(){try{connection.destroy();messageChannel.send("BUY PREMIUM TO KEEP THE BOT IN VC 24/7")}catch{}} , 600000)
            }
            if(queue.get(guild.id).loopStatue){
                if(!connection) return
                try{
                    var stream = await play.stream(currentAudioRes.metadata.url)
                }catch(error){
                    console.log("error"+error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `)
                    return message.channel.send("Something went wrong")
                }
                var newAudioResource = createAudioResource(stream.stream, {
                    inputType : stream.type,
                    metadata:{
                        messageChannel: messageChannel,
                        title: currentAudioRes.metadata.title,
                        url: currentAudioRes.metadata.url,
                        thumbnail: currentAudioRes.metadata.thumbnail,
                        guildId: currentAudioRes.metadata.guildId,
                        secDuration: currentAudioRes.metadata.secDuration,
                        rawDuration: currentAudioRes.metadata.rawDuration,
                        requestedBy: currentAudioRes.metadata.requestedBy,
                        data: currentAudioRes.metadata.data, //used for the seek option
                        channel: currentAudioRes.metadata.channel
                    }
                 })
                playSong(messageChannel , connection, newAudioResource)
            }else{
                queue.get(guild.id).resources.shift()
                if(queue.get(guild.id).resources.length !== 0){
                    playSong(messageChannel , connection , queue.get(guild.id).resources[0])
                }
            }
            
        })

        const queue_constructor = {
            messageChannel:null,
            resources: [],
            timeMusicStarted: null,
            audioPlayer: player,
            loopStatue:false
        }
        queue.set(guild.id , queue_constructor)
        
    })
})
client.on("messageCreate", async message => {
    let prefix = "-"
    let commandWithPrefix = message.content.split(" ")[0]
    let command = commandWithPrefix.slice(1 , commandWithPrefix.length).toLowerCase()
    var arg = message.content.slice(commandWithPrefix.length +1 , message.content.length)

    if (message.author.equals(client.user)) return;
    if (!message.content.startsWith(prefix)) return;

    const commandExe = client.commands.get(command) || client.commands.find(c => c.aliases && c.aliases.includes(command))
    if(commandExe) commandExe.execute(message , client, queue, arg)
    try{
    switch (command) {
        // case "dc": case"sik":
        //     var connection = getVoiceConnection(message.guildId)
        //     commands.get("dc").execute(message , connection)
        //     break
        // case "join":
        //     var channel = message.member.voice.channel
        //     if(!channel) return message.channel.send("Youre not in a channel")
        //     if(!channel.joinable)return message.channel.send("Bot doesn't have permission to join your voice channel")
        //     if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing && queue.get(message.guildId).resources.length !== 0) return message.channel.send("Mylo is currently being used in another voice channel")
        //     if(message.guild.me.voice.channelId == message.member.voice.channelId) return message.channel.send("Im already in your vc")
        //     var connection = joinVoiceChannel({
        //         channelId: channel.id,
        //         guildId: channel.guild.id,
        //         adapterCreator: channel.guild.voiceAdapterCreator,
        //     }).on(VoiceConnectionStatus.Disconnected , ()=>{
        //         connection.destroy()
        //     })
            // break;
        case "p":case "play":
            var query = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Join a channel")
            if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel")
            if(!query) return message.channel.send("Search for an actuall song")

            if(!getVoiceConnection(message.guildId)){
                let rawConnection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                }).on(VoiceConnectionStatus.Disconnected , () =>{
                    rawConnection.destroy()
                })

                var connection = await entersState(rawConnection , VoiceConnectionStatus.Ready , 30_000).catch(() =>{
                    return message.channel.send("Something went wrong please try again")
                })

            }else{
                var connection = getVoiceConnection(message.guildId)
            }

            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)

            var result = await play.search(query , { limit : 1 })
            if(result.length == 0) return message.channel.send("Couldn't find any result")
            console.log(result[0].channel)
            if(result[0].durationInSec > 3600) return message.channel.send("Video selected is longer than ``1 hour`` buy premium nigger")

            try{
                var data = await play.video_info(result[0].url)
                var stream = await play.stream(result[0].url)
            }catch(error){
                console.log("error"+error)
                client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `)
                return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification")
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
            if((queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Paused || queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing|| queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Buffering) &&  queue.get(message.guildId).resources.length != 0){
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
                message.channel.send({embeds:[embed]})
            }else if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle && queue.get(message.guildId).resources.length == 0){
                queue.get(message.guildId).resources.push(audioResource)
                playSong(message , connection, audioResource)
            }else{
                message.channel.send("Sorry , something went wrong that caused a queue system crash.We will have to clear your songs in the queue\n. We'll try our best to fix this issue soon...\nThx for you support , Mylo team support")
                queue.get(message.guildId).resources = []
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
            // .setFooter("By: **" + currentAudioRes.metadata.channel.name + "**" , currentAudioRes.metadata.channel.icon.url)
        message.channel.send({embeds:[embed]})
        break
        case "skip":case "s":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("koskesh mikhay kerm berizi?")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played")
            let membersCurrentlyVC = message.member.voice.channel.members.filter(member => !member.user.bot && message.author.id != member.id)
            function playNextSong(){
                var connection = getVoiceConnection(message.guildId)
                if(queue.get(message.guildId).resources.length > 1){
                    queue.get(message.guildId).resources.shift()
                    playSong(message , connection ,queue.get(message.guildId).resources[0])
                }else if(queue.get(message.guildId).resources.length == 1 ){
                    queue.get(message.guildId).loopStatue = false
                    connection.state.subscription.player.stop()
                    message.react("✅")
                }
                else{
                    message.channel.send("Nothing is being played")
                }
            }

            if(membersCurrentlyVC.size == 0 || membersCurrentlyVC.size == 1 ) return playNextSong()

            

            let userIdsAndVals = new Map()
            let votes = 1
            membersCurrentlyVC.forEach(member => userIdsAndVals.set(member.user.id ,{"state":false,"member":member,"clicks":0}))


            function newDescTable(){
                let tableArray = [[`${message.author.username}` , `✅`]] 
                userIdsAndVals.forEach(member => {
                    if (member.state){
                        tableArray.push([`${member.member.user.username}` ,`✅`])
                    }else{
                        tableArray.push([`${member.member.user.username}` , `⚪`])
                    }
                })
                return table(tableArray).toString()
            }  

            var row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('skip')
					.setLabel('Skip')
					.setStyle('SUCCESS')
			);

            var embedMessage = new MessageEmbed()
                .setAuthor(`${message.author.username} has started a music skip poll!` ,message.author.avatarURL())
                .setTitle(`If you want the music to be skipped click on the \"Skip\" button`+ "\n")
                .setDescription("```\n" + newDescTable() + "```")
                .setColor("#3BA55C")
                .setFooter("Members with dj role can use \"fs\" to force skip")

            var sentMessageSkip= await message.channel.send({components:[row],embeds:[embedMessage]})

            const skipComponnentFilter = i => userIdsAndVals.has(i.user.id)
            const skipcollector = message.channel.createMessageComponentCollector({ filter:skipComponnentFilter, time: 30000 })

            skipcollector.on("collect" ,async interaction =>{
                if(interaction.customId == "skip"){
                    userIdsAndVals.get(interaction.user.id).clicks ++
                    if(userIdsAndVals.get(interaction.user.id).clicks > 3) return interaction.deferUpdate()
                    if(userIdsAndVals.get(interaction.user.id).clicks > 2) {interaction.deferUpdate();return message.channel.send("KOS KOSH ENGHAD NAZAN ROOSH DIGE KHOB");}
                    if(userIdsAndVals.get(interaction.user.id).state){interaction.deferUpdate();return message.channel.send(`<@${interaction.user.id}> Youve already voted`);}
                    votes++

                    userIdsAndVals.get(interaction.user.id).state = true

                    let newEmbed =  new MessageEmbed()
                        .setAuthor(`${message.author.username} has started a music skip poll!` ,message.author.avatarURL())
                        .setTitle(`If you want the music to be skipped click on the \"Skip\" button`+ "\n")
                        .setDescription("```\n" + newDescTable() + "```")
                        .setColor("#3BA55C")
                        .setFooter("Members with dj role can use \"fs\" to force skip")
                    await interaction.update({ embeds:[newEmbed] })

                    if((votes/(message.member.voice.channel.members.size - 1)) >= 0.5 ){
                        skipcollector.stop()
                        return playNextSong()
                    }
                }
            })
            skipcollector.on("end" ,collected =>{
                if(collected.size == 0){
                    sentMessageSkip.edit({content: 'You ran out of time!', components: [], embeds:[]})
                }
            })              

        break
        case "fs":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("koskesh mikhay kerm berizi?")
            if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj")) return message.channel.send("koonkesh to ke dj nisti")
            var connection = getVoiceConnection(message.guildId)
            if(queue.get(message.guildId).resources.length > 1){
                queue.get(message.guildId).resources.shift()
                playSong(message , connection , queue.get(message.guildId).resources[0])
            }else if(queue.get(message.guildId).resources.length == 1 ){
                queue.get(message.guildId).loopStatue = false
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
                    seekVal: seekValFinal,
                    channel:currentAudioRes.metadata.channel,
                    streamData:stream
                }
             })
            player.play(resource)
            break
        case "search":
            var query = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            var channel = message.member.voice.channel
            if(!channel) return message.channel.send("Join a channel")
            if(!query) return message.channel.send("Search for an actuall song")

            if(!getVoiceConnection(message.guildId)){
                let rawConnection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                }).on(VoiceConnectionStatus.Disconnected , ()=>{
                    rawConnection.destroy()
                })

                var connection = await entersState(rawConnection , VoiceConnectionStatus.Ready , 30_000).catch(()=>{
                    return message.channel.send("Something went wrong please try again")
                })
            }else{
                var connection = getVoiceConnection(message.guildId)
            }
            var row = new MessageActionRow()
            .addComponents(
				new MessageButton()
                    .setCustomId('previous')
					.setLabel('ᐊ')
					.setStyle('SECONDARY'),

                new MessageButton()
                    .setCustomId('next')
					.setLabel('ᐅ')
					.setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('cancel')
					.setLabel('cancel')
					.setStyle('DANGER'),
			)
            message.channel.send(`**Searching...**🔎 \`\`${query}\`\``)
            var currentPage = 1
            var resultsRaw = await play.search(query , { limit : 20 })
            var results = arraySplitter(resultsRaw,5)


            function createEmbbed(){
                var embedSearch = new MessageEmbed()
                .setColor('#1202F7')
                .setAuthor('Requested By ' + message.author.username , message.author.avatarURL())
                .setTitle("Send the numbers of your choice or use the cancel button")
                .setFooter(`Page ${currentPage}/${results.length.toString()}`)

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

            const messageFilter = m => m.author.id == message.author.id
            const mcollector = message.channel.createMessageCollector({ filter:messageFilter , time: 30000 });

            const componnentFilter = i => i.user.id == message.author.id
            const collector = message.channel.createMessageComponentCollector({ filter:componnentFilter, time: 30000 });
            
            connection.once(VoiceConnectionStatus.Destroyed , ()=>{
                if(!collector.ended || !mcollector.ended){
                    collector.stop()
                    mcollector.stop()
                    message.channel.send("I got disconnected from the voice channel please try again")
                }
            })

            mcollector.on('collect', async m => {
                if(!/^\d+$/.test(m.content)) return message.channel.send("Please select a number between 1 to " + resultsRaw.length.toString())
                is_collected = true
                mcollector.stop()
                collector.stop()
                
                let selected = resultsRaw[parseInt(m.content) - 1 ]
                sentMessage.edit({embeds:[] ,components: [],content:`Selected: \`${selected.title}\``})
                try{
                    var data = await play.video_info(selected.url)
                    var stream = await play.stream(selected.url)
                }catch(error){
                    return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification")
                }

                var audioResource = createAudioResource(stream.stream,{
                    inputType : stream.type,
                    metadata:{
                        messageChannel:message.channel,
                        title: selected.title,
                        url: selected.url,
                        thumbnail: selected.thumbnail.url,
                        guildId: message.guildId,
                        secDuration: selected.durationInSec,
                        rawDuration: selected.durationRaw,
                        requestedBy: message.author.username,
                        data: data ,//used for the seek option
                        is_seeked:false,
                        channel:selected.channel,
                        streamData:stream
                    }
                })

                queueFunc(queue , message , connection, playSong , audioResource)

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
                    if (currentPage == results.length) return 
                    currentPage++
                    await collected.update({embeds:[createEmbbed()]})
                }
                else if(collected.customId == "previous"){
                    if (currentPage == 1) return
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
        case "pause":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("koskesh mikhay kerm berizi?")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Paused ) return message.channel.send("Already paused")

            var player = queue.get(message.guildId).audioPlayer
            player.pause()
            break
        case "unpause":case "resume":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("koskesh mikhay kerm berizi?")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing ) return message.channel.send("Not paused")

            var player = queue.get(message.guildId).audioPlayer
            player.unpause()
            break
        case "q":case "queue":
            if(!message.member.voice.channel) return message.channel.send("Youre not in a voice channel")
            if(message.guild.me.voice.channelId != message.member.voice.channelId) return message.channel.send("Youre not in the same channel as bot is")

            var guildQueue = queue.get(message.guildId).resources
            if(guildQueue.length == 0) return  message.channel.send("No song is being played")
            if(guildQueue.length == 1) return  message.channel.send("There's no song in queue if you want to check")

            var outPut = ""

            guildQueue.forEach(resource =>{
                outPut += resource.metadata.title + "\n"
            })
            message.channel.send(outPut)            
            break
        case "loop":case "repeat":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("koskesh mikhay kerm berizi?")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played")

            var statue = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            if(statue){
                switch(statue){
                    case "on":
                        if(queue.get(message.guildId).loopStatue){  
                            message.channel.send("Already on🔁")
                        }else{
                            message.channel.send("Loop is now on🔁")
                            queue.get(message.guildId).loopStatue = true
                        }
                        break
                    case "off":
                        if(!queue.get(message.guildId).loopStatue){  
                            message.channel.send("Already off")
                        }else{
                            message.channel.send("Loop is now off")
                            queue.get(message.guildId).loopStatue = false
                        }
                        break
                }
            }else{
                if(!queue.get(message.guildId).loopStatue){
                    queue.get(message.guildId).loopStatue = true
                    message.channel.send('Loop is now on 🔁')
                }else{
                    queue.get(message.guildId).loopStatue = false
                    message.channel.send('Loop is now off')
                }
            }
            break
        case "shuffle":
            if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc")
            if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played")
            if(queue.get(message.guildId).resources.length <= 2)return message.channel.send("There's not enough song in your queue , add more")
            
            var currentAudioRes = queue.get(message.guildId).resources[0]
            var audioRes = queue.get(message.guildId).resources
            audioRes.shift()
            var currentAudioResourcesArray = shuffle(audioRes)
            
            currentAudioResourcesArray.unshift(currentAudioRes)

            queue.get(message.guildId).resources = currentAudioResourcesArray
            message.channel.send("Done✅ \nCheck out current queue list using 'q'")
            break
        case "help":
            
            break
        }
    }catch(error){
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm. Error:\n" +`\`\`\`js\n${error} \`\`\` `)
    }
})

client.on("guildCreate", guild =>{
    console.log("Just joined: " + guild.name + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever')
    if(queue.has(guild.id)) return guild.channels.cache.find(c => c.type == "GUILD_TEXT" && c.permissionsLocked).send("Koonkesha mano kick karde boodin??")
    guild.channels.cache.find(c => c.type == "GUILD_TEXT" && c.permissionsLocked).send("salam sexia man umadam")

    var player = createAudioPlayer({
        behaviors:{
            noSubscriber: NoSubscriberBehavior.Stop
        }
    })
    console.log("creating a queue system map for " + guild.name)

    let timeOut = null

    player.on(AudioPlayerStatus.Playing, () => {
        clearTimeout(timeOut)
        var messageChannel = player.state.resource.metadata.messageChannel
        
        queue.get(guild.id).messageChannel = messageChannel
        if(!player.state.resource.metadata.is_seeked ){
            messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`")
        }else{
            messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`)
        }
        queue.get(guild.id).timeMusicStarted = new Date()
    });

    player.on('error', error => {
        var messageChannel = queue.get(guild.id).messageChannel
        console.log(`Error: ${error} with resource`);
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `)
        messageChannel.send("Something went wrong");
    })

    player.on(AudioPlayerStatus.Idle , async () => {
        let currentAudioRes = queue.get(guild.id).resources[0]
        var messageChannel = currentAudioRes.metadata.messageChannel

        var connection = getVoiceConnection(guild.id)        

        if(!connection){
            queue.get(guild.id).resources = []
        }else{
            timeOut = setTimeout(function(){try{connection.destroy();messageChannel.send("BUY PREMIUM TO KEEP THE BOT IN VC 24/7")}catch{}} , 600000)
        }
        if(queue.get(guild.id).loopStatue){
            if(!connection) return
            try{
                var stream = await play.stream(currentAudioRes.metadata.url)
            }catch(error){
                console.log("error"+error)
                client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `)
                return message.channel.send("Something went wrong")
            }
            var newAudioResource = createAudioResource(stream.stream, {
                inputType : stream.type,
                metadata:{
                    messageChannel: messageChannel,
                    title: currentAudioRes.metadata.title,
                    url: currentAudioRes.metadata.url,
                    thumbnail: currentAudioRes.metadata.thumbnail,
                    guildId: currentAudioRes.metadata.guildId,
                    secDuration: currentAudioRes.metadata.secDuration,
                    rawDuration: currentAudioRes.metadata.rawDuration,
                    requestedBy: currentAudioRes.metadata.requestedBy,
                    data: currentAudioRes.metadata.data, //used for the seek option
                    channel: currentAudioRes.metadata.channel
                }
             })
            playSong(messageChannel , connection, newAudioResource)
        }else{
            queue.get(guild.id).resources.shift()
            if(queue.get(guild.id).resources.length !== 0){
                playSong(messageChannel , connection , queue.get(guild.id).resources[0])
            }
        }
        
    })

    const queue_constructor = {
        messageChannel:null,
        resources: [],
        timeMusicStarted: null,
        audioPlayer: player,
        loopStatue:false
    }
    queue.set(guild.id , queue_constructor)
})

client.on('guildDelete', guild =>{
    queue.get(guild.id) = {}
})

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}

function playSong(messageOrChannel , connection , audioResource){    
    var player = queue.get(messageOrChannel.guildId).audioPlayer
    player.play(audioResource)
    connection.subscribe(player)
}

function isValidHttpUrl(string) {
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
  } 

client.login(process.env.TOKEN);