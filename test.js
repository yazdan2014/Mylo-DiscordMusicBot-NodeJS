
const play = require("play-dl")

async function myf(){
    if(play.is_expired()){
        await play.refreshToken() // This will check if access token has expired or not. If yes, then refresh the token.
    }
    let sp_data = await play.spotify("https://open.spotify.com/track/62LJFaYihsdVrrkgUOJC05?si=a286792f65e34ee0")
    console.log(sp_data.artists[0].name)
}