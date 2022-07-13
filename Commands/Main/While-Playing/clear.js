module.exports = {
    name : 'clear',
    aliases:["clean"],
    description: 'Deletes messages and commands on the bot in the channel the command is sent',
    execute(message , client, queue, arg){
        if (message.channel.messages.cache.size == 0) return null
        if (!message.channel.manageable) return message.channel.send("channel is not manageable for the bot") 
        message.channel.messages.cache.map(m => {
            if(m.content.startsWith(prefix) && m.deletable){
                m.delete()
            }
        })
    }
}