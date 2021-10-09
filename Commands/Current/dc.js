const {getVoiceConnection} = require("@discordjs/voice")

module.exports = {
    name : 'dc',
    aliases:["disconnect" , "fuckoff", "sik","leave"],
    description: 'disconnects the bot from the vc',
    execute(message , client, queue, arg){
        if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") || !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})
        var connection = getVoiceConnection(message.guildId)
        if(!connection) return message.channel.send("Im not in a channel")
        if(!message.member.voice.channel) return message.channel.send("Youre not in a voice channel")
        if(message.guild.me.voice.channelId != message.member.voice.channelId) return message.channel.send("Youre not in the same channel as bot is")
        connection.disconnect()
    }
}