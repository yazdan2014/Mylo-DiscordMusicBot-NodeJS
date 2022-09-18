const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const removeAtIndex = require('remove-at-index');


module.exports = {
    name : 'remove',
    aliases:["r"],
    description: 'Removes the song provided by the user',
    field: "DJ",
    execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!channel.joinable) return message.channel.send("Bot doesn't have permission to join your voice channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})


        try{
            if(parseInt(arg) <= 0 || !parseInt(arg)) return message.channel.send('Please provide a valid number')
            queue.get(message.guildId).resources = removeAtIndex(queue.get(message.guildId).resources, parseInt(arg))
            message.react("✅").catch(()=>{})
        }catch(err){
            message.channel.send('Please provide a valid number')
        } 

    }
}
