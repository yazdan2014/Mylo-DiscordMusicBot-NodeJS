const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const arraySplitter = require("split-array");
const {toEmoji} = require("number-to-emoji");

module.exports = {
    name : 'queue',
    aliases:["q"],
    description: 'Sends and embed messages including details about the current queue',
    async execute(message , client, queue, arg){
        if(!message.member.voice.channel) return message.channel.send("Youre not in a voice channel").catch(()=>{})
        if(message.guild.me.voice.channelId != message.member.voice.channelId) return message.channel.send("Youre not in the same channel as bot is").catch(()=>{})

        var guildQueue = queue.get(message.guildId).resources
        if(guildQueue.length == 0) return  message.channel.send("No song is being played").catch(()=>{})
        if(guildQueue.length == 1) return  message.channel.send("There's no song in queue for you to check").catch(()=>{})

        var row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setLabel('ᐊ')
                .setStyle('SECONDARY')
                .setDisabled(true),

            new MessageButton()
                .setCustomId('next')
                .setLabel('ᐅ')
                .setStyle('SECONDARY')
                .setDisabled((results.length==1))
        )
        var currentPage = 1
        var resultsRaw = guildQueue
        var results = arraySplitter(resultsRaw,15)

        function createEmbbed(){
            var embedQueue = new MessageEmbed()
            .setColor('#1202F7')
            .setAuthor('Requested By ' + message.author.username , message.author.avatarURL())
            .setTitle("Queue")
            .setFooter(`Page ${currentPage}/${results.length.toString()}`)

            var outPut = ""
            results[currentPage-1].forEach(function(result , i) {
                var finalResTitle 
                if(result.metadata.title.length >= 60){
                    finalResTitle = result.metadata.title.substring(0 , 60) + "..."
                }else{
                    finalResTitle = result.metadata.title
                }
                outPut += (++i + 15*(currentPage-1)).toString() + ". `" + finalResTitle +"`"+ "\n"
            })
            embedQueue.setDescription(outPut)
            return embedQueue
        }

        let sentMessage = await message.channel.send({embeds:[createEmbbed()] ,components: [row]}).catch(()=>{})

        const componnentFilter = i => i.user.id == message.author.id
        const collector = sentMessage.createMessageComponentCollector({ filter:componnentFilter, time: 120000 });

        collector.on("collect" , async collected =>{
            if(collected.customId == "next"){
                currentPage++
            }
            else if(collected.customId == "previous"){
                currentPage--
            }

            if(currentPage == 1) row.components[0].setDisabled(true)
            else if(row.components[0].disabled) row.components[0].setDisabled(false)

            if (currentPage == results.length) row.components[1].setDisabled(true)
            else if(row.components[1].disabled) row.components[1].setDisabled(false)


            await collected.update({embeds:[createEmbbed()], components:[row]})
        })

        collector.on("end" ,collector =>{
            row.components[0].setDisabled(true)
            row.components[1].setDisabled(true)
            sentMessage.edit({components: [row], embeds:[createEmbbed()]})
        })  
    }
}
