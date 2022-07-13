module.exports = {
    name : 'clear',
    aliases:["clean"],
    description: 'Deletes messages and commands on the bot in the channel the command is sent',
    execute(message , client, queue, arg){
        let prefix = '-'
        if (message.channel.messages.cache.size == 0) return null
        if (!message.channel.manageable) return message.channel.send("channel is not manageable for the bot") 
        console.log(message.channel.messages.cache.size)
            message.channel.messages.fetch({limit:100}).then(msgs=>{
                msgs.map(m=>{
                    if((m.content.startsWith(prefix) || m.author.username === "888431987919028244") && m.deletable){
                        try {
                            m.delete()
                        } catch(err){}
                    }
                })
            })
    }
}