const {AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior , getVoiceConnection, entersState } = require('@discordjs/voice');
const play = require("play-dl")

module.exports = (guildId, queue)=>{
    var player = createAudioPlayer({
        behaviors:{
            noSubscriber: NoSubscriberBehavior.Play
        }
    })

    player.on(AudioPlayerStatus.Playing, () => {
        var messageChannel = player.state.resource.metadata.messageChannel

        queue.get(guildId).messageChannel = messageChannel
        queue.get(guildId).resources[0].metadata.timeMusicStarted[1] = new Date()

        if(!messageChannel) return

        if(queue.get(guildId).singleLoopStatue) return
        if(player.state.resource.metadata.msgSent) return
        switch(player.state.resource.metadata.type){
            case "yt": messageChannel.send("<:YouTube:1002557862414913657> **Playing** " + "`" + queue.get(guildId).resources[0].metadata.title + "`").catch(()=>{}) 
                break

            case "sp": messageChannel.send("<:Spotify:1002558485675905064> **Playing** " + "`" + queue.get(guildId).resources[0].metadata.title + "`").catch(()=>{}) 
                break

            case "so": messageChannel.send("<:SO:1002539204447846420> **Playing** " + "`" + queue.get(guildId).resources[0].metadata.title + "`").catch(()=>{}) 
                break
        }
        player.state.resource.metadata.msgSent = true
    })

    player.on('error', error => {
        var messageChannel = queue.get(guildId).messageChannel
        console.log(`Error: ${error} with resource`);
        client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`\nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
        messageChannel.send("Something went wrong").catch(()=>{})
    })
    player.on(AudioPlayerStatus.Buffering ,async (oldState)=>{
        var messageChannel = queue.get(guildId).messageChannel
        await entersState(player , AudioPlayerStatus.Playing , 5_000).catch(()=>{
            try{
                messageChannel.send("Something went wrong heading to the next song...").catch(()=>{})
            }catch{}
            player.stop(true)
        })      
    })

    player.on(AudioPlayerStatus.Idle , async () => {
        let currentAudioRes = queue.get(guildId).resources[0]
        if(currentAudioRes){
            var messageChannel = currentAudioRes.metadata?.messageChannel
        }
        else var messageChannel = null
        var connection = getVoiceConnection(guildId)        
        
        if(queue.get(guildId).singleLoopStatue){
            if(!connection) return
            try{
                var stream = await play.stream(currentAudioRes.metadata.url)
            }catch(error){
                console.log("error"+error)
                client.guilds.cache.get("896070505717727272").channels.cache.get("896070505717727278").send(`Server Name: \nPlayer Error\n` +`\`\`\`js\n${error} \`\`\` `).catch(()=>{})
                return message.channel.send("Something went wrong").catch(()=>{})
            }
            var newAudioResource = createAudioResource(stream.stream, {
                inputType : stream.type,
                metadata:{
                    messageChannel: messageChannel,
                    timeMusicStarted:[0,null],
                    msgSent:true,
                    title: currentAudioRes.metadata.title,
                    url: currentAudioRes.metadata.url,
                    thumbnail: currentAudioRes.metadata.thumbnail,
                    guildId: currentAudioRes.metadata.guildId,
                    secDuration: currentAudioRes.metadata.secDuration,
                    rawDuration: currentAudioRes.metadata.rawDuration,
                    requestedBy: currentAudioRes.metadata.requestedBy,
                    data: currentAudioRes.metadata.data, //used for the seek option
                    channel: currentAudioRes.metadata.channel,
                    type:currentAudioRes.metadata.type
                }
             })
             var player = queue.get(guildId).audioPlayer
             player.play(newAudioResource)
        }else{
            queue.get(guildId).resources.shift()
            if(queue.get(guildId).resources.length !== 0){
                var player = queue.get(guildId).audioPlayer
                player.play( queue.get(guildId).resources[0])
            }
        }
    })

    const queue_constructor = {
        messageChannel:null,
        resources: [],
        audioPlayer: player,
        singleLoopStatue:false,
        queueLoopStatue:false
    }
    queue.set(guildId , queue_constructor)

    return player
}