const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');

// const fetch = require('node-fetch');

module.exports = {
    name : 'queue',
    aliases:["q"],
    description: 'resumes the paused song',
    async execute(message , client, queue, arg){
        if(!message.member.voice.channel) return message.channel.send("Youre not in a voice channel").catch(()=>{})
        if(message.guild.me.voice.channelId != message.member.voice.channelId) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})

        var guildQueue = queue.get(message.guildId).resources
        if(guildQueue.length == 0) return  message.channel.send("No song is being played").catch(()=>{})
        if(guildQueue.length == 1) return  message.channel.send("There's no song in queue if you want to check").catch(()=>{})

        var outPut = ""

        guildQueue.forEach(function(resource,index) {
            if(index == 0)return outPut += "▶️Now playing **" + resource.metadata.title + "**\n\n"
            outPut +=  index + ". `" + resource.metadata.title + "`\n"
        })

        var embed = new MessageEmbed()
        .setTitle("Queue Review")
        .setDescription(outPut)
        .setColor('#DFFF00')
        .setFooter("requested by:" + message.author.username, message.author.avatarURL())

        message.channel.send({embeds:[embed]})
    }
}