const {AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior , getVoiceConnection, entersState } = require('@discordjs/voice');

module.exports = (queue, message, connection)=>{
    const player = queue.get(message.guildId).audioPlayer

    if(player.state.status == AudioPlayerStatus.Playing){
        let resource =  player.state.resource
        connection.send(JSON.stringify({'type': 'status', "status":"playing" , "guildId":message.guildId, 'metadata':resource.metadata}))
    }else if(player.state.status == AudioPlayerStatus.Idle){
        connection.send(JSON.stringify({'type': 'status', "status":"idle" , "guildId":message.guildId}))
    }

    player.on("stateChange", (oldState , newState)=>{
        if(newState.status == AudioPlayerStatus.Idle){
            connection.send(JSON.stringify({'type': 'status', "status":"idle" , "guildId":message.guildId}))
        }else if (newState.status == AudioPlayerStatus.Playing){
            let resource =  player.state.resource
            connection.send(JSON.stringify({'type': 'status', "status":"playing" , "guildId":message.guildId, 'metadata':resource.metadata}))
        }
    })
}