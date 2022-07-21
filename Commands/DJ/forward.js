const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
// const fetch = require('node-fetch')


client.commands = new Collection()
const fs = require('fs');
module.exports = {
    name : 'rewind',
    aliases:[],
    description: 'Seeks the current song to the point provided by the user',
    async execute(message , client, queue, arg){
        message.channel.send("Command will be added soon")
    }
}