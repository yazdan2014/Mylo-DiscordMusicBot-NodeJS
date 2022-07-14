const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });

const play = require('./play')
const fs = require('../While-Playing/fs')


const {joinVoiceChannel , AudioPlayerStatus, VoiceConnectionStatus} = require("@discordjs/voice")

module.exports = {
    name : 'playskip',
    aliases:["ps"],
    description: 'Adds a song to the queue and skips straights to it',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

        var query = arg.replaceAll("#", "sharp")
        if(!query) return message.channel.send("Search for an actuall song").catch(()=>{})
        

        queue.get(message.guildId).resources.splice(1 , queue.get(message.guildId).resources.length + 1)
        fs.execute(message,client,queue,arg)
        play.execute(message,client,queue,arg)
    }
}