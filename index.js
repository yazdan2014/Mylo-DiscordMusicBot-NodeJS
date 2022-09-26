const { Client , Collection} = require('discord.js');
const {AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
// const fetch = require('node-fetch');


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

const cooldown = new Map()
//{"guild" , {"count":int , "activated":bool}}


const queue = new Map()
//Global queue for the bot. Every guild will have a key and value pair in this map. { guild.id , [queue_constructor{resources{} ,nowplayingdate] } }

const socket = require("./Dashboard/socketCreator")


client.once('ready', () => {
	console.log('Ready!')
    client.guilds.cache.forEach(guild => {
        var player = createAudioPlayer({
            behaviors:{
                noSubscriber: NoSubscriberBehavior.Play
            }
        })

        player.on(AudioPlayerStatus.Playing, () => {
            var messageChannel = player.state.resource.metadata.messageChannel

            queue.get(guild.id).messageChannel = messageChannel
            queue.get(guild.id).timeMusicStarted = new Date()

            if(!messageChannel) return

            if(queue.get(guild.id).singleLoopStatue) return
            if(player.state.resource.metadata.msgSent) return
            switch(player.state.resource.metadata.type){
                case "yt": messageChannel.send("<:YouTube:1002557862414913657> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{}) 
                    break

                case "sp": messageChannel.send("<:Spotify:1002558485675905064> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{}) 
                    break

                case "so": messageChannel.send("<:SO:1002539204447846420> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{}) 
                    break
            }
            player.state.resource.metadata.msgSent = true
            
        });

        player.on('error', error => {
            var messageChannel = queue.get(guild.id).messageChannel
            console.log(`Error: ${error} with resource`);
            client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: ${guild.name}\nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
            
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
            if(currentAudioRes){
                var messageChannel = currentAudioRes.metadata?.messageChannel
            }
            else var messageChannel = null
            var connection = getVoiceConnection(guild.id)        
            
            if(queue.get(guild.id).singleLoopStatue){
                if(!connection) return
                try{
                    var stream = await play.stream(currentAudioRes.metadata.url)
                }catch(error){
                    console.log("error"+error)
                    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: ${guild.name}\nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                    return message.channel.send("Something went wrong").catch(()=>{})
                }
                var newAudioResource = createAudioResource(stream.stream, {
                    inputType : stream.type,
                    metadata:{
                        messageChannel: messageChannel,
                        msgSent:true,
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
            singleLoopStatue:false,
            queueLoopStatue:false
        }
        queue.set(guild.id , queue_constructor)
        
    })
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Mylo is ready to be used!").catch(()=>{})
})

socket.socketCreator(queue)

client.on("messageCreate", async message => {
    let prefix = "-"
    let commandWithPrefix = message.content.split(" ")[0]
    let command = commandWithPrefix.slice(1 , commandWithPrefix.length).toLowerCase()
    var arg = message.content.slice(commandWithPrefix.length +1 , message.content.length)

    if (message.author.equals(client.user)) return;
    if (!message.content.startsWith(prefix)) return;

    if(cooldown.has(message.guildId)){
        if(cooldown.get(message.guildId).activated) return

        cooldown.get(message.guildId ).count =  cooldown.get(message.guildId).count + 1 
        
        if(cooldown.get(message.guildId).count >= 5){
            cooldown.get(message.guildId ).activated = true
            
            setTimeout(()=>{
                cooldown.delete(message.guildId)
            },3000)

            return message.channel.send("CHIill oUt. Please try again 6secs!")
        }
    }else{
        cooldown.set(message.guildId , {
            count: 1,
            activated: false
        })

        setTimeout(()=>{
            if(!cooldown.get(message.guildId).activated) cooldown.delete(message.guildId)
        },5000)
    }
    const commandExe = client.commands.get(command) || 
                       client.commands.find(c => c.aliases && c.aliases.includes(command))
    try{
        if(commandExe) commandExe.execute(message , client, queue, arg)
    }catch(err){
        message.channel.send("Something went wrong!").catch(()=>{})
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: ${message.guild.name}\nCommand sent by: ${message.author.username} \nCommand Execution Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
        console.log(err)
    }
})

client.on("guildCreate", guild =>{
    console.log("Just joined: " + guild.name + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever')
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("Just joined: " + guild.name + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever').catch(()=>{})

    try{
        guild.channels.cache.find(c => c.type == "GUILD_TEXT" && guild.me.permissionsIn(c).has('VIEW_CHANNEL') && guild.me.permissionsIn(c).has('SEND_MESSAGES')).send("Thx for adding me!! the bot is currently on BETA demo version.\nIf you've found any bugs please contact the staff in our server.\nhttps://discord.gg/ApGSg9c9p6").catch(()=>{})
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
            if(!player.state.resource.metadata.msgSent) messageChannel.send("<:YT:890526793625391104> **Playing** " + "`" + queue.get(guild.id).resources[0].metadata.title + "`").catch(()=>{})
        }else{
            messageChannel.send(`**Set position to** \`\`${secToMinSec(player.state.resource.metadata.seekVal)}\`\` ⏩`).catch(()=>{})
        }
        queue.get(guild.id).timeMusicStarted = new Date()
    });

    player.on('error', error => {
        var messageChannel = queue.get(guild.id).messageChannel
        console.log(`Error: ${error} with resource`);
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: ${guild.name}\nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
        messageChannel.send("Something went wrong").catch(()=>{})
    })

    player.on(AudioPlayerStatus.Idle , async () => {
        let currentAudioRes = queue.get(guild.id).resources[0]
        var messageChannel = currentAudioRes.metadata.messageChannel

        var connection = getVoiceConnection(guild.id)        

        if(queue.get(guild.id).singleLoopStatue){
            if(!connection) return
            try{
                var stream = await play.stream(currentAudioRes.metadata.url)
            }catch(error){
                console.log("error"+error)
                client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: ${guild.name}\nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                return message.channel.send("Something went wrong").catch(()=>{})
            }
            var newAudioResource = createAudioResource(stream.stream, {
                inputType : stream.type,
                metadata:{
                    messageChannel: messageChannel,
                    msgSent:true,
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
        singleLoopStatue:false
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

client.login("ODg4NDMxOTg3OTE5MDI4MjQ0.GfpJUx.HUf1tmmpBQbLgOfZUS2KkBoQsLgUa_feyLRtxQ");