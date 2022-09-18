const { Client , MessageEmbed, MessageActionRow, MessageButton, Interaction , Collection} = require('discord.js');
const {StreamType,VoiceConnectionStatus, AudioPlayerStatus, createAudioResource ,createAudioPlayer , NoSubscriberBehavior ,joinVoiceChannel , getVoiceConnection, entersState } = require('@discordjs/voice');
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES" ] });
const play = require("play-dl")
// const fetch = require('node-fetch');
const replayCom = require("./seek")

client.commands = new Collection()
const fs = require('fs');
module.exports = {
    name : 'replay',
    aliases:[],
    description: 'Replays the current song',
    field: "DJ",
    async execute(message , client, queue, arg){
        replayCom.execute(message , client, queue, "0")
    }
}