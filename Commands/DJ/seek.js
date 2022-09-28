const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
// const fetch = require('node-fetch');

function secToMinSec(sec){
    let durationInSec = sec
    let minutes= (Math.floor(durationInSec/60)).toString()
    let seconds= ((durationInSec%60 < 10) ? "0" + (durationInSec%60).toString() : (durationInSec%60).toString() )
    let output = minutes + ":"+ seconds
    return output
}

client.commands = new Collection()
const fs = require('fs');
module.exports = {
    name : 'seek',
    aliases:[],
    description: 'Seeks the current song to the point provided by the user',
    field: "DJ",
    async execute(message , client, queue, arg){
            var connection = getVoiceConnection(message.guildId)

            if(!connection ) return message.channel.send("Im not in a voice channel").catch(()=>{})
            if(!connection.state.subscription) return message.channel.send("Nothing is being played").catch(()=>{})
            if(!message.member.roles.cache.some(r=> r.name.toLowerCase() == "dj") && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send("Only members with the \"DJ\" role or administrator permission can control bot actions").catch(()=>{})

            var currentAudioRes = connection.state.subscription.player.state.resource
            if(!currentAudioRes) return message.channel.send("Nothing is being played").catch(()=>{})

            if(!arg) return message.channel.send("Please provide a valid seek val")
            if(currentAudioRes.metadata.type == "so")return message.channel.send("Seek command doesn't work for soundcloud tracks")
            var seekVal = arg
            if(!(seekVal && (/^\d+$/.test(seekVal) || /^[0-5]?[0-9]:[0-5]?[0-9]$/.test(seekVal)))) return message.channel.send("Please choose a correct NATURAL NUMERIC seek value").catch(()=>{})
            var seekValFinal = 0

            if(seekVal.includes(":")){
                seekValFinal += parseInt(seekVal.split(":")[0]) * 60 + parseInt(seekVal.split(":")[1])
            }else{
                seekValFinal = parseInt(seekVal)
            }

            if(seekValFinal < 0 || seekValFinal >= parseInt(currentAudioRes.metadata.secDuration)) return message.channel.send("Please choose a correct value between ``0 to " + currentAudioRes.metadata.secDuration + "`` or ``"+ currentAudioRes.metadata.rawDuration + "``" ).catch(()=>{})

            let player = connection.state.subscription.player
            let url = currentAudioRes.metadata.url

            const source = await play.stream(url, { seek : seekValFinal }) 

            var resource = createAudioResource(source.stream , {
                inputType : source.type,
                metadata:{
                    messageChannel: message.channel,
                    timeMusicStarted:[seekValFinal,null],
                    msgSent:false,
                    title: currentAudioRes.metadata.title,
                    url: currentAudioRes.metadata.url,
                    thumbnail: currentAudioRes.metadata.thumbnail,
                    guildId: currentAudioRes.metadata.guildId,
                    secDuration: currentAudioRes.metadata.secDuration,
                    rawDuration: currentAudioRes.metadata.rawDuration,
                    requestedBy: currentAudioRes.metadata.requestedBy,
                    data: currentAudioRes.metadata.data, //used for the seek option
                    is_seeked:true,
                    seekVal: seekValFinal,
                    channel:currentAudioRes.metadata.channel,
                    type:currentAudioRes.metadata.type
                }
             })
            player.play(resource)
            message.channel.send(`**Set position to** \`\`${secToMinSec(resource.metadata.seekVal)}\`\` ⏩`).catch(()=>{})
    }
}