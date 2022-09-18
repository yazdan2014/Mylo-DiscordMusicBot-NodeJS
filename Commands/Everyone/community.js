const {joinVoiceChannel , AudioPlayerStatus, VoiceConnectionStatus} = require("@discordjs/voice")

module.exports = {
    name : 'community',
    aliases:["support", "server" , "guild"],
    description: 'Sends the invitaion link to community server',
    field: "Everyone",
    execute(message , client, queue, arg){
        message.channel.send("https://discord.com/oauth2/authorize?client_id=888431987919028244&scope=bot&permissions=3394624")
    }
}
