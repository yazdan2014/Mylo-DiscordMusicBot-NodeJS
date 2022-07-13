module.exports = {
    name : 'clear',
    aliases:["clean"],
    description: 'Deletes messages and commands on the bot in the channel the command is sent',
    execute(message , client, queue, arg){
        let prefix = '-'
        if (message.channel.messages.cache.size == 0) return null
        if (!message.channel.manageable) return message.channel.send("channel is not manageable for the bot")
        message.channel.messages.fetch({limit:100}).then(async msgs=>{
            let col = msgs.filter(m => (m.content.startsWith(prefix) || /^\d+$/.test(message.content) || m.author.id == client.user.id) && m.deletable)
            await message.channel.bulkDelete(col,true)
            message.channel.send('done! ✅').then(m =>{
                setTimeout(() => { m.delete() }, 5000)
            })
        })

    }
}