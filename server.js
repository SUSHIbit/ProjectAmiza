require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const CryptoJS = require('crypto-js');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Environment variables
const PORT = process.env.PORT || 3000;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key';

// Store active chats for each client
const activeChats = new Map();

// Initialize Discord client
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping
  ]
});

// Message encryption function
function encryptMessage(message) {
  return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
}

// Message decryption function
function decryptMessage(encryptedMessage) {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Discord bot event handlers
discordClient.once('ready', async () => {
  console.log(`Discord bot logged in as ${discordClient.user.tag}`);
  
  // Set up interval to refresh friend data every 30 seconds
  setInterval(async () => {
    try {
      const friends = await fetchDiscordFriends();
      io.emit('friendsUpdate', { friends });
      console.log(`Auto-refreshed friends list: ${friends.length} friends found`);
    } catch (error) {
      console.error('Error auto-refreshing friends list:', error);
    }
  }, 30000); // 30 seconds
  
  // Initial friends fetch
  try {
    const friends = await fetchDiscordFriends();
    console.log(`Initial friends fetch: ${friends.length} friends found`);
  } catch (error) {
    console.error('Error in initial friends fetch:', error);
  }
});

// Listen for guild member events
discordClient.on('guildMemberAdd', async (member) => {
  console.log(`New member joined: ${member.user.username} (${member.guild.name})`);
  
  // Refresh friends list and emit to clients
  try {
    const friends = await fetchDiscordFriends();
    io.emit('friendsUpdate', { friends });
  } catch (error) {
    console.error('Error refreshing friends after member add:', error);
  }
});

discordClient.on('guildMemberRemove', async (member) => {
  console.log(`Member left: ${member.user.username} (${member.guild.name})`);
  
  // Refresh friends list and emit to clients
  try {
    const friends = await fetchDiscordFriends();
    io.emit('friendsUpdate', { friends });
  } catch (error) {
    console.error('Error refreshing friends after member remove:', error);
  }
});

// Fetch user's connections/relationships
async function fetchDiscordFriends() {
  try {
    console.log('Starting to fetch Discord friends...');
    
    // For Discord bots, we can't directly get "friends" like a regular user
    // Instead, we can get users from our DM channels or guilds
    const dmChannels = await discordClient.channels.cache.filter(channel => 
      channel.type === 1 && // DM channel type
      channel.recipient && 
      !channel.recipient.bot
    );
    
    console.log(`Found ${dmChannels.size} DM channels`);

    // Also collect users from mutual guilds
    const guildMembers = [];
    
    // Log available guilds
    console.log(`Bot is in ${discordClient.guilds.cache.size} guilds:`);
    discordClient.guilds.cache.forEach(guild => {
      console.log(`- Guild: ${guild.name} (ID: ${guild.id}, Member count: ${guild.memberCount})`);
    });
    
    // Force fetch all guild members before processing
    for (const guild of discordClient.guilds.cache.values()) {
      console.log(`Fetching members for guild: ${guild.name}`);
      try {
        // Try to fetch all members first
        await guild.members.fetch();
        console.log(`Successfully fetched ${guild.members.cache.size} members from ${guild.name}`);
      } catch (err) {
        console.error(`Error fetching members for guild ${guild.name}:`, err.message);
      }
      
      guild.members.cache.forEach(member => {
        if (!member.user.bot && member.user.id !== discordClient.user.id) {
          guildMembers.push({
            id: member.user.id,
            username: member.user.username,
            avatar: member.user.displayAvatarURL(),
            discriminator: member.user.discriminator || '',
            source: 'guild',
            guildName: guild.name
          });
          console.log(`Added guild member: ${member.user.username} from ${guild.name}`);
        }
      });
    }
    
    console.log(`Found ${guildMembers.length} guild members total`);

    // Process DM channels
    const dmUsers = [];
    dmChannels.forEach(channel => {
      if (channel.recipient) {
        dmUsers.push({
          id: channel.recipient.id,
          username: channel.recipient.username,
          avatar: channel.recipient.displayAvatarURL(),
          discriminator: channel.recipient.discriminator || '',
          source: 'dm'
        });
        console.log(`Added DM user: ${channel.recipient.username}`);
      }
    });
    
    console.log(`Found ${dmUsers.length} DM users`);

    // Combine and remove duplicates
    const combinedUsers = [...dmUsers];
    
    guildMembers.forEach(guildMember => {
      if (!combinedUsers.find(u => u.id === guildMember.id)) {
        combinedUsers.push(guildMember);
      }
    });
    
    console.log(`Returning ${combinedUsers.length} total users`);
    return combinedUsers;
  } catch (error) {
    console.error('Error fetching Discord relationships:', error);
    return [];
  }
}

discordClient.on('messageCreate', async (message) => {
  // Ignore messages from bots (including our own)
  if (message.author.bot) return;
  
  try {
    // Only process DMs
    if (!message.guild && message.author.id !== discordClient.user.id) {
      console.log(`Received DM from ${message.author.username}: ${message.content}`);
      
      try {
        // Try to decrypt the message
        const decryptedMessage = decryptMessage(message.content);
        
        // Emit the decrypted message to all connected clients
        io.emit('message', {
          sender: message.author.username,
          senderId: message.author.id,
          content: decryptedMessage,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error decrypting message:', error);
        // If we can't decrypt, it might not be an encrypted message, so we'll ignore it
      }
    }
  } catch (error) {
    console.error('Error handling Discord message:', error);
  }
});

// Socket.io connection handlingio.on('connection', (socket) => {  console.log('New client connected');    // Store user data  let userData = {    username: null,    discordId: null,    encryptionKey: null,    activeChat: null  };    // Handle user login  socket.on('login', (data) => {    try {      const { username, discordId, encryptionKey } = data;            // Store user data for this socket      userData.username = username;      userData.discordId = discordId;      userData.encryptionKey = encryptionKey || ENCRYPTION_KEY;            console.log(`User logged in: ${username} (Discord ID: ${discordId})`);            // Let the client know login was successful      socket.emit('loginSuccess', { username });    } catch (error) {      console.error('Error during login:', error);      socket.emit('error', { message: 'Login failed. Please try again.' });    }  });    // Set up the active chat for this user  activeChats.set(socket.id, null);    // Handle switching chats  socket.on('selectFriend', async (userId) => {    try {      console.log(`Client ${socket.id} selected friend: ${userId}`);            // Update the active chat for this client      activeChats.set(socket.id, userId);      userData.activeChat = userId;            // Let the client know their selection was successful      socket.emit('friendSelected', { userId });    } catch (error) {      console.error('Error selecting friend:', error);      socket.emit('error', { message: 'Failed to select friend' });    }  });    socket.on('sendMessage', async (data) => {    try {      const { message } = data;      const targetUserId = activeChats.get(socket.id);            if (!targetUserId) {        socket.emit('error', { message: 'Please select a friend to chat with first' });        return;      }            if (!userData.encryptionKey) {        socket.emit('error', { message: 'No encryption key provided. Please refresh and login again.' });        return;      }            // Encrypt the message with the user's specific key      const encryptedMessage = CryptoJS.AES.encrypt(message, userData.encryptionKey).toString();            // Send the encrypted message via Discord DM      try {        const user = await discordClient.users.fetch(targetUserId);        if (user) {          await user.send(encryptedMessage);          console.log(`Sent encrypted DM to ${user.username} from ${userData.username || 'anonymous'}`);                    // Also emit to the sender so they can see their own message          socket.emit('message', {            sender: 'You',            senderId: 'self',            content: message,            timestamp: new Date().toISOString()          });        } else {          socket.emit('error', { message: 'User not found' });        }      } catch (error) {        console.error('Error sending Discord message:', error);        socket.emit('error', { message: 'Failed to send message' });      }    } catch (error) {      console.error('Error sending message:', error);      socket.emit('error', { message: 'Failed to send message' });    }  });    socket.on('disconnect', () => {    console.log('Client disconnected');    // Clean up when a client disconnects    activeChats.delete(socket.id);  });});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API route to get Discord friends
app.get('/api/friends', async (req, res) => {
  try {
    const friends = await fetchDiscordFriends();
    res.json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Login to Discord
discordClient.login(DISCORD_BOT_TOKEN).catch(error => {
  console.error('Failed to log in to Discord:', error);
}); 