const {Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions} = require("discord.js");
const client = new Client({
    'intents': [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
	],
});

/* Config */
const token = "MTE4ODM2MzQyOTY5ODg3MTMwNw.GCC3GT.YRxDfi5NrM66L_RJr8OJkZ_QJw-ruzA7Iq--Dw"; // Bot token here
const ownerID = 0; // Optional, put your own ID here so that you're the only one who can run bot commands
/* Config */

let victim = 0; // This variable will be dynamically updated to the ID of the person you specify with !troll, best to leave this alone
client.on("ready", () => {
    // Fetches every member of all the guilds the bot is in (probably not required)
    client.guilds.cache.forEach((guild) => {
        guild.members.fetch();
    });
    console.log(`The bot is ready! Logged in as ${client.user.username}#${client.user.discriminator}`);
});

function joinChannel(channel) {
    const {  createAudioResource, createAudioPlayer, joinVoiceChannel, NoSubscriberBehavior } = require('@discordjs/voice');
    const audioPlayer = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause
        }
    });
    var audioResource = createAudioResource("audio.mp3");

    audioPlayer.play(audioResource);
    audioPlayer.pause();

    const connection = joinVoiceChannel({
	    channelId: channel.id,
	    guildId: channel.guild.id,
	    adapterCreator: channel.guild.voiceAdapterCreator,
    });
    connection.subscribe(audioPlayer);

    connection.receiver.speaking.on('start', (userId) => {
        //actions here
        if (userId == victim) {
            console.log("Speaking");
            audioPlayer.unpause(); // Play audio when they start talking
            audioResource = createAudioResource("audio.mp3");
            audioPlayer.play(audioResource);
        } else {
            console.log("Stopped Speaking");
            audioPlayer.pause(); // Pause audio when they stop talking
        }});
}

client.on("messageCreate", message => {
    if (message.content.startsWith("!troll")) {
        if (ownerID != 0 && parseInt(message.author.id) !== ownerID) return; // If ownerID is specified, ignore everyone else besides the owner
        let args = message.content.split(" ");
        try {message.delete();}catch(e){}; // Delete the message if we have the perms to do so
        if (args[1] == null) {
            // No ID specified
            message.author.send("You need to put the ID of the person you're trying to troll after the command (example: !troll 1234567890)");
            return;
        }
        let victimMember = message.guild.members.cache.get(args[1]); // Get member object from ID
        if (victimMember != null) {
            // Member exists
            victim = args[1]
            message.author.send(`I set the victim to <@${args[1]}>! If they're already in a VC, I'll auto-join. If not, I'll join the VC right after they do!`);
            message.author.send(`Now trolling: ${victimMember.user.username}#${victimMember.user.discriminator} (ID: ${victim})`);
            if (victimMember.voice.channel != null) {
                joinChannel(victimMember.voice.channel); // Join the victim's VC if they're already in one
            }
        } else {
            // ID is invalid, at least for the message's guild
            message.author.send("I couldn't find that user in your server, double check the ID?");
        }
    }
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
    if (newMember.channel != null) {
        // User joined a voice channel
        if (newMember.id == victim) joinChannel(newMember.channel); // Follow them into the voice channel
    } else {
        // User left the voice channel
        try {
            if (newMember.id == victim) oldMember.channel.leave(); // Leave with them
        } catch(e){}; // If we do get an error, it's probably that the bot doesn't have any VC to leave, nothing important
    }
});

client.login(token);
