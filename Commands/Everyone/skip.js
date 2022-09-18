const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
// const fetch = require('node-fetch');

const table = require('text-table');

module.exports = {
    name : 'skip',
    aliases:["s","stop"],
    description: 'starts a skip poll for the current song',
    field: "Everyone",
    async execute(message , client, queue, arg){
        var channel = message.member.voice.channel
        if(!channel) return message.channel.send("Join a channel").catch(()=>{})
        if(!message.guild.me.voice.channel) return message.channel.send("Im not in a vc").catch(()=>{})
        if(!message.member.voice.channel)return message.channel.send("Youre not in a vc")
        if(message.member.voice.channel.id !== message.guild.me.voice.channel.id)return message.channel.send("Youre not in the same voice channel as bot is").catch(()=>{})
        if(queue.get(message.guildId).audioPlayer.state.status == AudioPlayerStatus.Idle ) return message.channel.send("Nothing is being played").catch(()=>{})
        let membersCurrentlyVC = message.member.voice.channel.members.filter(member => !member.user.bot && message.author.id != member.id)
        function playNextSong(){
            var connection = getVoiceConnection(message.guildId)
            if(queue.get(message.guildId).resources.length > 1){
                connection.state.subscription.player.stop()
            }else if(queue.get(message.guildId).resources.length == 1 ){
                queue.get(message.guildId).singleLoopStatue = false 
                connection.state.subscription.player.stop()
                message.react("✅")
            }
            else{
                message.channel.send("Nothing is being played").catch(()=>{})
            }
        }

        if(membersCurrentlyVC.size == 0 || membersCurrentlyVC.size == 1 ) return playNextSong()


        let userIdsAndVals = new Map()
        let votes = 1
        membersCurrentlyVC.forEach(member => userIdsAndVals.set(member.user.id ,{"state":false,"member":member,"clicks":0}))


        function newDescTable(){
            let tableArray = [[`${message.author.username}` , `✅`]] 
            userIdsAndVals.forEach(member => {
                if (member.state){
                    tableArray.push([`${member.member.user.username}` ,`✅`])
                }else{
                    tableArray.push([`${member.member.user.username}` , `⚪`])
                }
            })
            return table(tableArray).toString()
        }  

        var row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('skip')
                .setLabel('Skip')
                .setStyle('SUCCESS')
        );

        var embedMessage = new MessageEmbed()
            .setAuthor(`${message.author.username} has started a music skip poll!` ,message.author.avatarURL())
            .setTitle(`If you want the music to be skipped click on the \"Skip\" button`+ "\n")
            .setDescription("```\n" + newDescTable() + "```")
            .setColor("#3BA55C")
            .setFooter("Members with dj role can use \"fs\" to force skip")

        var sentMessageSkip= await message.channel.send({components:[row],embeds:[embedMessage]}).catch(()=>{})

        const skipComponnentFilter = i => userIdsAndVals.has(i.user.id)
        const skipcollector = sentMessageSkip.createMessageComponentCollector({ filter:skipComponnentFilter, time: 30000 })

        skipcollector.on("collect" ,async interaction =>{
            if(interaction.customId == "skip"){
                userIdsAndVals.get(interaction.user.id).clicks ++
                if(userIdsAndVals.get(interaction.user.id).clicks > 3) return interaction.deferUpdate()
                if(userIdsAndVals.get(interaction.user.id).clicks > 2) {interaction.deferUpdate();return message.channel.send("KOS KOSH ENGHAD NAZAN ROOSH DIGE KHOB").catch(()=>{})}
                if(userIdsAndVals.get(interaction.user.id).state){interaction.deferUpdate();return message.channel.send(`<@${interaction.user.id}> Youve already voted`).catch(()=>{})}
                votes++

                userIdsAndVals.get(interaction.user.id).state = true

                let newEmbed =  new MessageEmbed()
                    .setAuthor(`${message.author.username} has started a music skip poll!` ,message.author.avatarURL())
                    .setTitle(`If you want the music to be skipped click on the \"Skip\" button`+ "\n")
                    .setDescription("```\n" + newDescTable() + "```")
                    .setColor("#3BA55C")
                    .setFooter("Members with dj role can use \"fs\" to force skip")
                await interaction.update({ embeds:[newEmbed] })

                if((votes/(message.member.voice.channel.members.size - 1)) >= 0.5 ){
                    skipcollector.stop()
                    return playNextSong()
                }
            }
        })
        skipcollector.on("end" ,collected =>{
            if(collected.size == 0){
                sentMessageSkip.edit({content: 'You ran out of time!', components: [], embeds:[]})
            }
        })              
    }
}
