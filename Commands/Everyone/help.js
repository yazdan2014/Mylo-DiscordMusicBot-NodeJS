const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const arraySplitter = require("split-array");
const {toEmoji} = require("number-to-emoji");

module.exports = {
    name : 'help',
    aliases:["commands","cmds"],
    description: 'Sends a list of available commands',
    field: "Everyone",
    async execute(message , client, queue, arg){
        // var row = new MessageActionRow()
        // .addComponents(
        //     new MessageButton()
        //         .setCustomId('everyone')
        //         .setLabel('Everyone')
        //         .setStyle('SUCCESS')
        //         .setDisabled(true),

        //     new MessageButton()
        //         .setCustomId('dj')
        //         .setLabel('DJ')
        //         .setStyle('DANGER'),

        //     new MessageButton()
        //         .setCustomId('admin')
        //         .setLabel('Admin')
        //         .setStyle('PRIMARY'),

        //     new MessageButton()
        //         .setCustomId('premium')
        //         .setLabel('Premium')
        //         .setStyle('SECONDARY'),            
        // )

        // var currentPage = "DJ"
        // function createEmbbed(field){
        //     var embedQueue = new MessageEmbed()
        //     .setColor('#ED4245')
        //     .setAuthor('Requested By ' + message.author.username , message.author.avatarURL())
        //     .setTitle("Queue")
        //     .setFooter(`Page ${currentPage}`)
        //     let commands = client.commands.filter(c => c.field == field)
        //     for (let command of commands){
        //         outPut += `
        //         **-${command.name}**
        //         aliases: ${command.aliases}
        //         description: ${command.description}
        //         `
        //     }
        //     var outPut = "S"
            
        //     embedQueue.setDescription(outPut)
        //     return embedQueue
        // }
        message.channel.send("https://mylo.fm/")
    }
}