const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');

module.exports = {
    name : 'resume',
    aliases:["unpause"],
    description: 'resumes the paused song',
    field: "DJ",
    async execute(message , client, queue, arg)
    {
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Playing ) return message.channel.send("Not paused").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

        var player = queue.get(message.guildId).audioPlayer
        player.unpause()
    }
}