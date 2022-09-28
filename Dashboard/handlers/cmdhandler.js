module.exports = (queue, message,connection)=>{
    const audioPlayer = queue.get(message.guildId).audioPlayer
    switch(message.command){
        case "forceskip":
            audioPlayer.stop()
            break

        case "pause":
            audioPlayer.pause()
            break
        
        case "unpause":
            audioPlayer.unpause()
            break
    }
    
}