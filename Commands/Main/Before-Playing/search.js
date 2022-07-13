const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
const arraySplitter = require("split-array")
// const fetch = require('node-fetch');

const queueFunc = require("./Imports/queue")
const {toEmoji} = require("number-to-emoji");

module.exports = {
    name : 'search',
    aliases:["searchsong"],
    description: 'forceskips the current song',
    async execute(message , client, queue, arg){
        var query = message.content.slice(commandWithPrefix.length +1 , message.content.length).replaceAll("#", "sharp")
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!query) return message.channel.send("Search for an actuall song").catch(()=>{})

        var row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setLabel('ᐊ')
                .setStyle('SECONDARY'),

            new MessageButton()
                .setCustomId('next')
                .setLabel('ᐅ')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('cancel')
                .setLabel('cancel')
                .setStyle('DANGER'),
        )
        message.channel.send(`**Searching...**🔎 \`\`${query}\`\``).catch(()=>{})
        var currentPage = 1
        var resultsRaw = await play.search(query , { limit : 20 })
        var results = arraySplitter(resultsRaw,5)

        function createEmbbed(){
            var embedSearch = new MessageEmbed()
            .setColor('#1202F7')
            .setAuthor('Requested By ' + message.author.username , message.author.avatarURL())
            .setTitle("Send the numbers of your choice or use the cancel button")
            .setFooter(`Page ${currentPage}/${results.length.toString()}`)

            var outPut = ""
            results[currentPage-1].forEach(function(result , i) {
                var finalResTitle 
                if(result.title.length >= 60){
                    finalResTitle = result.title.substring(0 , 60) + "..."
                }else{
                    finalResTitle = result.title
                }
                outPut += toEmoji(++i + 5*(currentPage-1)) + "`" + finalResTitle +"`"+ "\n"
            })
            embedSearch.setDescription(outPut)
            return embedSearch
        }

        var sentMessage = await message.channel.send({embeds:[createEmbbed()] ,components: [row]}).catch(()=>{})

        if(!getVoiceConnection(message.guildId)){
            var connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            })
        }else{
            var connection = getVoiceConnection(message.guildId)
        }

        var is_canceled = false
        var is_collected = false

        const messageFilter = m => m.author.id == message.author.id
        const mcollector = message.channel.createMessageCollector({ filter:messageFilter , time: 30000 });

        const componnentFilter = i => i.user.id == message.author.id
        const collector = message.channel.createMessageComponentCollector({ filter:componnentFilter, time: 30000 });
        
        connection.once(VoiceConnectionStatus.Destroyed , ()=>{
            if(!collector.ended || !mcollector.ended){
                collector.stop()
                mcollector.stop()
                message.channel.send("I got disconnected from the voice channel please try again").catch(()=>{})
            }
        })

        mcollector.on('collect', async m => {
            if(!/^\d+$/.test(m.content)) return message.channel.send("Please select a number between 0 to " + resultsRaw.length.toString()).catch(()=>{})
            is_collected = true
            mcollector.stop()
            collector.stop()
            
            let selected = resultsRaw[parseInt(m.content) - 1 ]
            sentMessage.edit({embeds:[] ,components: [],content:`Selected: \`${selected.title}\``})
            try{
                var data = await play.video_info(selected.url)
                var stream = await play.stream(selected.url)
            }catch(error){
                return message.channel.send("Something went wrong , this is probably because youre trying to play a song which which requires age verification").catch(()=>{})
            }

            var audioResource = createAudioResource(stream.stream,{
                inputType : stream.type,
                metadata:{
                    messageChannel:message.channel,
                    title: selected.title,
                    url: selected.url,
                    thumbnail: selected.thumbnail.url,
                    guildId: message.guildId,
                    secDuration: selected.durationInSec,
                    rawDuration: selected.durationRaw,
                    requestedBy: message.author.username,
                    data: data ,//used for the seek option
                    is_seeked:false,
                    channel:selected.channel,
                    type:"yt"
                }
            })
            
            if(connection.state.status != VoiceConnectionStatus.Ready){
                await entersState(connection , VoiceConnectionStatus.Ready , 10_000).catch(() =>{
                    return message.channel.send("Something went wrong please try again").catch(()=>{})
                })
            }
            
            queueFunc(queue , message , connection , audioResource)

        });

        mcollector.on('end', collected => {
            if(collected.size == 0 && !is_canceled){
                message.channel.send("Didn't recive any number").catch(()=>{})
            }
        });

        collector.on("collect" , async collected =>{
            if(collected.customId == "cancel"){
                await collected.update({ content: 'Search proccess canceled successfuly!', components: [], embeds:[] });
                is_canceled = true
                collector.stop()
                mcollector.stop()
            }
            else if(collected.customId == "next"){
                if (currentPage == results.length) return 
                currentPage++
                await collected.update({embeds:[createEmbbed()]})
            }
            else if(collected.customId == "previous"){
                if (currentPage == 1) return
                currentPage--
                await collected.update({embeds:[createEmbbed()]})
            }
        })
        collector.on("end" ,collector =>{
            if(!is_canceled && !is_collected){
                sentMessage.edit({content: 'You ran out of time!', components: [], embeds:[]})
            }
        })  

    }
}
            