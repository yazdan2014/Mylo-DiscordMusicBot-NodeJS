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
                .setStyle('SECONDARY'),

            new MessageButton()
                .setCustomId('next')
                .setLabel('ᐅ')
                .setStyle('SECONDARY')
        )
        var currentPage = 1
        var resultsRaw = guildQueue
        var results = arraySplitter(resultsRaw,5)

        function createEmbbed(){
            var embedSearch = new MessageEmbed()
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
                outPut += toEmoji(++i + 5*(currentPage-1)) + "`" + finalResTitle +"`"+ "\n"
            })
            embedSearch.setDescription(outPut)
            return embedSearch
        }

        var sentMessage = await message.channel.send({embeds:[createEmbbed()] ,components: [row]}).catch(()=>{})

        const componnentFilter = i => i.user.id == message.author.id
        const collector = message.channel.createMessageComponentCollector({ filter:componnentFilter, time: 120000 });

        collector.on("collect" , async collected =>{
            if(collected.customId == "next"){
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
    }
}
