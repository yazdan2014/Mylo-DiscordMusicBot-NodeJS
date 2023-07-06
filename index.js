const { Client , Collection} = require('discord.js');
const {AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
// const fetch = require('node-fetch');

const audioPlayerCreator = require("./Imports/audioplayerCreator")

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
                    for(let file of currentFinalDir){
                        let command = require(`./Commands/${dir}/${newDir}/${finalDir}/${file}`)
                        if(Object.keys(command).length != 0){
                            client.commands.set(command.name, command)
                        }
                    }
                }
            }else{
                console.log("---------------"+newDir+"---------------")
                for(let file of newCurrentDir){
                    let command = require(`./Commands/${dir}/${newDir}/${file}`)
                    if(Object.keys(command).length != 0){
                        client.commands.set(command.name, command)
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
    client.guilds.cache.forEach(guild => {
        audioPlayerCreator(guild.id, queue)
    })
    console.log('Ready!')
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
    audioPlayerCreator(guild.id, queue)
})

client.on('guildDelete', guild =>{
    queue.set(guild.id , null)
    client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send("just left"+ guild.name +`fuck you.` + "\nThere are currently "+ client.guilds.cache.size  + 'guilds using the coolest bot ever').catch(()=>{})

})

client.on("voiceStateUpdate" , (oldState , newState)=>{
    if(!oldState.member.user.equals(client.user))return
    let connection = getVoiceConnection(oldState.guild.id)
    let player = queue.get(oldState.guild.id).audioPlayer
    if(oldState.channel != null && newState.channel != null){ connection.subscribe(player);return }
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

// client.login(process.env.TOKEN);
