const {MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');


module.exports = {
    name : 'forceskip',
    aliases:["fs","forcestop"],
    description: 'forceskips the current song',
    async execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})
        var connection = getVoiceConnection(message.guildId)
        if(queue.get(message.guildId).resources.length > 1){
            connection.state.subscription.player.stop()
        }else if(queue.get(message.guildId).resources.length == 1 ){
            queue.get(message.guildId).singleLoopStatue = false
            connection.state.subscription.player.stop()
            message.react("✅").catch(()=>{})
        }
        else{
            message.channel.send("Nothing is being played").catch(()=>{})
        }
    }
}
