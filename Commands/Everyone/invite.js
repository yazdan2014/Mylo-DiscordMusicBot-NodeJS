const {joinVoiceChannel , AudioPlayerStatus, VoiceConnectionStatus} = require("@discordjs/voice")

module.exports = {
    name : 'invite',
    aliases:[],
    description: 'Sends the invitaion link for the bot',
    field: "Everyone",
    execute(message , client, queue, arg){
        message.channel.send("https://discord.com/oauth2/authorize?client_id=888431987919028244&scope=bot&permissions=3394624")
    }
}
