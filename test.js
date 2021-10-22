
const play = require("play-dl")

async function myf(){

let sp_data = await play.spotify("https://open.spotify.com/track/62LJFaYihsdVrrkgUOJC05?si=a286792f65e34ee0")
console.log(sp_data.artists)}

myf()