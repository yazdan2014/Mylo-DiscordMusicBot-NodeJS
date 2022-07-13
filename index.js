const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');

const table = require('text-table');
const shuffle = require('shuffle-array')
const changeSeek = require("./ffmpeg")
const {toEmoji} = require("number-to-emoji");


client.commands = new Collection()
const fs = require('fs');

fs.readdirSync('./Commands').forEach(dir =>{
    let currentDir = fs.readdirSync(`./Commands/${dir}/`)
    if(currentDir.filter(file => file.endsWith(".js")).length == 0){
        for(let newDir of currentDir){
            let newCurrentDir = fs.readdirSync(`./Commands/${dir}/${newDir}`)
            if(newCurrentDir.filter(file => file.endsWith(".js")).length == 0){
                for(let finalDir of newCurrentDir){
                    let currentFinalDir = fs.readdirSync(`./Commands/${dir}/${newDir}/${finalDir}`)
                    console.log("---------------"+finalDir+"---------------")
                    for(let file of currentFinalDir){
                        let command = require(`./Commands/${dir}/${newDir}/${finalDir}/${file}`)
                        if(Object.keys(command).length != 0){
                            client.commands.set(command.name, command)
                            console.log(command)
                        }
                    }
                }
            }else{
                console.log("---------------"+newDir+"---------------")
                for(let file of newCurrentDir){
                    let command = require(`./Commands/${dir}/${newDir}/${file}`)
                    if(Object.keys(command).length != 0){
                        client.commands.set(command.name, command)
                        console.log(command)
                    }
                }
            }
        }
    }else{
        console.log("---------------"+dir+"---------------")
        for(let file of currentDir){
            let command = require(`./Commands/${dir}/${file}`)
            if(Object.keys(command).length != 0){
                client.commands.set(command.name, command)
                console.log(command)
            }
        }
    }
})

const cooldowns = new Map()
//{"guild" , "new discord collection"}

const queue = new Map()
//Global queue for the bot. Every guild will have a key and value pair in this map. { guild.id , [queue_constructor{resources{} ,nowplayingdate] } }


client.once('ready', () => {
	console.log('Ready!')
    let mame= ""
    client.guilds.cache.forEach(guild => {
        var player = createAudioPlayer({
            behaviors:{
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        console.log("creating a queue system map for " + guild.name)
        mame += "creating a queue system map for " + guild.name + "\n"

        player.on(AudioPlayerStatus.Playing, () => {
            var messageChannel = player.state.resource.metadata.messageChannel

            queue.get(guild.id).messageChannel = messageChannel
            queue.get(guild.id).timeMusicStarted = new Date()

            if(!messageChannel) return
            if(!player.state.resource.metadata.is_seeked ){
                if(queue.get(guild.id).loopStatue) return
                switch(player.state.resource.metadata.type){
                    case "yt": messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{}) 
                        break

                    case "sp": messageChannel.send("<:SP:901160685264855070> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{}) 
                        break
                }
            }else{
                messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`).catch(()=>{})
            }
        });

        player.on('error', error => {
            var messageChannel = queue.get(guild.id).messageChannel
            console.log(`Error: ${error} with resource`);
            client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
            
            messageChannel.send("Something went wrong").catch(()=>{})
        })

        player.on(AudioPlayerStatus.Buffering ,async (oldState)=>{
            var messageChannel = queue.get(guild.id).messageChannel
            await entersState(player , AudioPlayerStatus.Playing , 5_000).catch(()=>{
                try{
                    messageChannel.send("Something went wrong heading to the next song...").catch(()=>{})
                }catch{}
                player.stop(true)
            })      
        })

        player.on(AudioPlayerStatus.Idle , async () => {
            let currentAudioRes = queue.get(guild.id).resources[0]
            if(currentAudioRes.metadata){
                var messageChannel = currentAudioRes.metadata?.messageChannel
            }
            else var messageChannel = null
            var connection = getVoiceConnection(guild.id)        
            
            if(queue.get(guild.id).loopStatue){
                if(!connection) return
                try{
                    var stream = await play.stream(currentAudioRes.metadata.url)
                }catch(error){
                    console.log("error"+error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                    return message.channel.send("Something went wrong").catch(()=>{})
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
                        channel: currentAudioRes.metadata.channel,
                        type:currentAudioRes.metadata.type
                    }
                 })
                 var player = queue.get(guild.id).audioPlayer
                 player.play(newAudioResource)
            }else{
                queue.get(guild.id).resources.shift()
                if(queue.get(guild.id).resources.length !== 0){
                    var player = queue.get(guild.id).audioPlayer
                    player.play( queue.get(guild.id).resources[0])
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
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(mame).catch(()=>{})

})

client.on("messageCreate", async message => {
    let prefix = "-"
    let commandWithPrefix = message.content.split(" ")[0]
    let command = commandWithPrefix.slice(1 , commandWithPrefix.length).toLowerCase()
    var arg = message.content.slice(commandWithPrefix.length +1 , message.content.length)

    if (message.author.equals(client.user)) return;
    if (!message.content.startsWith(prefix)) return;

    const commandExe = client.commands.get(command) || 
                       client.commands.find(c => c.aliases && c.aliases.includes(command))

    // if(!cooldowns.has(commandExe.name)){
    //     cooldowns.set(commandExe.name, new Collection())
    // }

    // const current_time = Date.now()
    // const cooldown_constructor = {last_try: current_time, already_sent:false}
    // const time_stamps = cooldowns.get(commandExe.name)
    // const cooldown_amount = (commandExe.cooldown) * 1000

    // if(time_stamps.has(message.guildId)){
    //     const expiratoin_time = time_stamps.get(message.guildId).last_try + cooldown_amount
    //     const sent_statue = time_stamps.get(message.guildId).already_sent
    //     if(current_time < expiratoin_time ){
    //         const time_left = (expiratoin_time - current_time)

    //         if(!sent_statue){
    //             return message.reply(`Please ${time_left.toFixed(0)} more seconds before using the command again`)
    //         }else{
    //             return
    //         }
    //     }
    // }

    // time_stamps.set(message.guildId, cooldown_constructor)
    // setTimeout(()=> time_stamps.delete(message.guildId) , cooldown_amount)

    try{
        if(commandExe) commandExe.execute(message , client, queue, arg)
    }catch{
        message.channel.send("Something went wrong!").catch(()=>{})
    }

    try{
    switch (command) {
        case "seek":
            message.channel.send("Seek option is temporarily unavailabe")
            // var connection = getVoiceConnection(message.guildId)

            // if(!connection ) return message.channel.send("Im not in a voice channel").catch(()=>{})
            // if(!connection.state.subscription) return message.channel.send("Nothing is being played").catch(()=>{})
            // if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

            // var currentAudioRes = connection.state.subscription.player.state.resource
    
            // if(!currentAudioRes) return message.channel.send("Nothing is being played").catch(()=>{})

            // var seekVal = message.content.slice(commandWithPrefix.length +1 , message.content.length)
            // if(!(seekVal && (/^\d+$/.test(seekVal) || /^[0-5]?[0-9]:[0-5]?[0-9]$/.test(seekVal)))) return message.channel.send("Please choose a correct NATURAL NUMERIC seek value").catch(()=>{})
            // var seekValFinal = 0

            // if(seekVal.includes(":")){
            //     seekValFinal += parseInt(seekVal.split(":")[0]) * 60 + parseInt(seekVal.split(":")[1])
            // }else{
            //     seekValFinal = parseInt(seekVal)
            // }

            // if(seekValFinal < 0 || seekValFinal >= parseInt(currentAudioRes.metadata.secDuration)) return message.channel.send("Please choose a correct value between ``0 to " + currentAudioRes.metadata.secDuration + "`` or ``"+ currentAudioRes.metadata.rawDuration + "``" ).catch(()=>{})

            // var data = currentAudioRes.metadata.data
            // var player = connection.state.subscription.player
            // var ffmpegInstance = changeSeek(seekValFinal.toString(), data.format[0].url)
            // var resource = createAudioResource(ffmpegInstance, {
            //     inputType : StreamType.OggOpus,
            //     metadata:{
            //         messageChannel: message.channel,
            //         title: currentAudioRes.metadata.title,
            //         url: currentAudioRes.metadata.url,
            //         thumbnail: currentAudioRes.metadata.thumbnail,
            //         guildId: currentAudioRes.metadata.guildId,
            //         secDuration: currentAudioRes.metadata.secDuration,
            //         rawDuration: currentAudioRes.metadata.rawDuration,
            //         requestedBy: currentAudioRes.metadata.requestedBy,
            //         data: currentAudioRes.metadata.data, //used for the seek option
            //         is_seeked:true,
            //         seekVal: seekValFinal,
            //         channel:currentAudioRes.metadata.channel,
            //         type:currentAudioRes.metadata.type
            //     }
            //  })
            // player.play(resource)
            break
        case "clear":

            break

        }
    }catch(error){
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm. Error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
    }
})

client.on("guildCreate", guild =>{
    console.log("Just joined: " + guild.name + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever')
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Just joined: " + guild.name + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever').catch(()=>{})

    try{
        guild.channels.cache.find(c => c.type == "GUILD_TEXT" && guild.me.permissionsIn(c).has('VIEW_CHANNEL') && guild.me.permissionsIn(c).has('SEND_MESSAGES')).send("Thx for adding me!! the bot is currently on BETA demo version.\nIf you've found any bugs please contact the staff in our server.\nFeel free to join our server link is pasted down below:\nhttps://discord.gg/k3EB2MCC").catch(()=>{})
    }
    catch{}

    var player = createAudioPlayer({
        behaviors:{
            noSubscriber: NoSubscriberBehavior.Play
        }
    })
    console.log("creating a queue system map for " + guild.name)


    player.on(AudioPlayerStatus.Playing, () => {
        var messageChannel = player.state.resource.metadata.messageChannel
        
        queue.get(guild.id).messageChannel = messageChannel
        if(!player.state.resource.metadata.is_seeked ){
            messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{})
        }else{
            messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`).catch(()=>{})
        }
        queue.get(guild.id).timeMusicStarted = new Date()
    });

    player.on('error', error => {
        var messageChannel = queue.get(guild.id).messageChannel
        console.log(`Error: ${error} with resource`);
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
        messageChannel.send("Something went wrong").catch(()=>{})
    })

    player.on(AudioPlayerStatus.Idle , async () => {
        let currentAudioRes = queue.get(guild.id).resources[0]
        var messageChannel = currentAudioRes.metadata.messageChannel

        var connection = getVoiceConnection(guild.id)        

        if(queue.get(guild.id).loopStatue){
            if(!connection) return
            try{
                var stream = await play.stream(currentAudioRes.metadata.url)
            }catch(error){
                console.log("error"+error)
                client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Koonkesha karetoon khoob bood ye error peyda kardinm, error:\n" +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                return message.channel.send("Something went wrong").catch(()=>{})
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
                    channel: currentAudioRes.metadata.channel,
                    type: currentAudioRes.metadata.type
                }
             })
            var player = queue.get(guild.id).audioPlayer
            player.play(newAudioResource)
        }else{
            queue.get(guild.id).resources.shift()
            if(queue.get(guild.id).resources.length !== 0){
                var player = queue.get(guild.id).audioPlayer
                player.play(queue.get(guild.id).resources[0])
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
    queue.set(guild.id , null)
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("just left"+ guild.name +`fuck you.` + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever').catch(()=>{})
})

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}

client.on("voiceStateUpdate" , (oldState , newState)=>{
    if(!oldState.member.user.equals(client.user))return
    let connection = getVoiceConnection(oldState.guild.id)
    let player = queue.get(oldState.guild.id).audioPlayer
    if(oldState.channel != null && newState.channel != null){ connection.subscribe(player);console.log("move");return }
    else if(oldState.channel != null && newState.channel == null ) { 
        try{
            connection.destroy();
            if(queue.get(oldState.guild.id).resources.length > 0 ){
                queue.get(oldState.guild.id).resources = [queue.get(oldState.guild.id).resources[0]]
            }else{
                queue.get(oldState.guild.id).resources = []
            }
            queue.get(oldState.guild.id).audioPlayer.stop(true);
            console.log("DC")}
        catch{} ; 
        return
    }
    else if(!(oldState.channel == null && newState.channel != null)) return

    connection.subscribe(player)
    if(oldState.guild.id == "877035736057151539" || oldState.guild.id == "503230476824346645") return
    let timeOut = setTimeout(function(){
        try{
            getVoiceConnection(oldState.guild.id).destroy()
        }catch{}
    } , 600_000)

    let interval = setInterval(function(){
        if(player.state.status == AudioPlayerStatus.Idle){
            if(getVoiceConnection(oldState.guild.id)) return
            try{
                clearTimeout(timeOut)
                clearInterval(interval)
            }catch{}
        }else if(player.state.status == AudioPlayerStatus.Playing){
            try{
                timeOut.refresh()
            }catch{}
        }
    } , 5_000)
})

client.login(process.env.TOKEN);