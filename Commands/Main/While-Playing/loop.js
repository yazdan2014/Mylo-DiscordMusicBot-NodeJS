const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');

module.exports = {
    name : 'loop',
    aliases:[],
    description: 'loops the current song',
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

        var statue = arg
        if(statue){
            switch(statue){
                case "on":
                    if(queue.get(message.guildId).singleLoopStatue){  
                        message.channel.send("Already on🔁").catch(()=>{})
                    }else{
                        message.channel.send("Single loop is now on🔁").catch(()=>{})
                        queue.get(message.guildId).singleLoopStatue = true
                    }
                    break
                case "off":
                    if(!queue.get(message.guildId).singleLoopStatue){  
                        message.channel.send("Already off").catch(()=>{})
                    }else{
                        message.channel.send("Single loop is now off").catch(()=>{})
                        queue.get(message.guildId).singleLoopStatue = false
                    }
                    break
            }
        }else{
            if(!queue.get(message.guildId).singleLoopStatue){
                queue.get(message.guildId).singleLoopStatue = true
                message.channel.send('Single loop is now on 🔁')
            }else{
                queue.get(message.guildId).singleLoopStatue = false
                message.channel.send('Single loop is now off')
            }
        }
    }
}