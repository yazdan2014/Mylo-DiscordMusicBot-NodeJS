const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });

const play = require('../everyone/play')
const fs = require('./forceskip')

module.exports = {
    name : 'playskip',
    aliases:["ps"],
    description: 'Adds a song to the queue and skips straight to it',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})
        try{
            if((message.member.voice.channel.id !== message.guild.me.voice.channel.id) && queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})
        }catch{}
        
        if (queue.get(message.guildId).queueloopStatue)return message.channel.send("Queue loop is currently on , please turn it off before adding new songs to the queue")


        var query = arg.replaceAll("#", "sharp")
        if(!query) return message.channel.send("Search for an actuall song").catch(()=>{})

        queue.get(message.guildId).resources.splice(1 , queue.get(message.guildId).resources.length + 1)
        fs.execute(message,client,queue,arg)
        play.execute(message,client,queue,arg)
    }
}
