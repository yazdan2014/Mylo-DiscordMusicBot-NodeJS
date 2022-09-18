const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const {MessageEmbed} = require("discord.js")
const solenolyrics= require("solenolyrics"); 

module.exports = {
    name : 'lyrics',
    aliases:["lr"],
    description: 'Sends an embed message with the current song lyrics',
    field: "Everyone",
    async execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})

        let msg = await message.channel.send("Finding the lyrics...")

        let song = queue.get(message.guildId).resources[0].metadata
        let lyrics = await solenolyrics.requestLyricsFor(song.title)
        if (!lyrics) return message.channel.send("No result was found")
        var embed = new MessageEmbed()
            .setColor('#1202F7')
            .setAuthor('Lyrics🎵' , client.user.avatarURL())
            .setTitle(song.title)
            .setDescription('`'+ lyrics +'`')
        message.channel.send({embeds:[embed]}).catch(()=>{})

        msg.delete()
    }
}