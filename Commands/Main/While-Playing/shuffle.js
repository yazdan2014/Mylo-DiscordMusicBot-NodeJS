const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');

const shuffle = require('shuffle-array')


module.exports = {
    name : 'shuffle',
    aliases:[],
    description: 'Shuffles the current queue',
    async execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(queue.get(message.guildId).resources.length <= 2)return message.channel.send("There's not enough song in your queue , add more").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

        var currentAudioRes = queue.get(message.guildId).resources[0]
        var audioRes = queue.get(message.guildId).resources
        audioRes.shift()
        var currentAudioResourcesArray = shuffle(audioRes)
        
        currentAudioResourcesArray.unshift(currentAudioRes)

        queue.get(message.guildId).resources = currentAudioResourcesArray
        message.channel.send("Done✅ \nCheck out current queue list using 'q'").catch(()=>{})
    }
}