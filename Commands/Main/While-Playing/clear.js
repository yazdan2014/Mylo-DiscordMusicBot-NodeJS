module.exports = {
    name : 'clear',
    aliases:["clean"],
    description: 'Deletes messages and commands on the bot in the channel the command is sent',
    execute(message , client, queue, arg){
        let prefix = '-'
        if (message.channel.messages.cache.size == 0) return null
        if (!message.channel.manageable) return message.channel.send("channel is not manageable for the bot")
        message.channel.messages.fetch({limit:100}).then(async (msgs)=>{
             for (const m of msgs){
                if((m.content.startsWith(prefix) || m.author.id == client.user.id) && m.deletable){
                    try {
                        await m.delete()
                    } catch{}
                }
            }
                
            message.channel.send('done! ✅').then(m =>{
                m.delete({timeout:5000})
            })
        })

    }
}