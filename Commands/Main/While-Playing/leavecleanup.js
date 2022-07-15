const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const queueCom = require('./queue')

module.exports = {
    name : 'leavecleanup',
    aliases:["lc" , "lcu"],
    description: 'Removes songs from users that have left the voice channel',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})
        
        let vcMembers = message.member.voice.channel.members.map(m=> m.user.username)

        let rest_res = queue.get(message.guildId).resources.splice(1 , queue.get(message.guildId).resources.length + 1)
        try{
            console.log(rest_res[0])
            console.log("--------------")
            console.log(vcMembers)
            rest_res = rest_res.filter(r=>vcMembers.includes(r.metadata.requestedBy))
            console.log(rest_res)
            queue.get(message.guildId).resources = queue.get(message.guildId).resources.concat(rest_res)
        }catch(err){console.log(err)}

        message.channel.send("Done, Heres your new queue :")
        queueCom.execute()
    }
}