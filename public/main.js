// Connect to Socket.io server
const socket = io();

// DOM elements
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('messages');
const msgInput = document.getElementById('msg');
const selectedFriendElement = document.getElementById('selected-friend');
const friendsList = document.getElementById('friends-list');
const refreshFriendsBtn = document.getElementById('refresh-friends');
const friendSearchInput = document.getElementById('friend-search');
const errorNotification = document.getElementById('error-notification');
const errorText = document.getElementById('error-text');
const closeErrorBtn = document.getElementById('close-error');

// App state
let friends = [];
let selectedFriend = null;
let messageHistory = new Map(); // Store messages by friend ID

// Function to format time
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Function to show error notification
const showError = (message) => {
    errorText.textContent = message;
    errorNotification.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorNotification.classList.remove('show');
    }, 5000);
};

// Function to show friend update notification
const showFriendUpdateNotification = (friendCount) => {
    // Create a temporary notification for friend updates
    const notification = document.createElement('div');
    notification.className = 'friend-update-notification';
    notification.textContent = `Friend list updated! ${friendCount} friends available.`;
    
    document.body.appendChild(notification);
    
    // Make it appear
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

// Close error notification when clicking the close button
closeErrorBtn.addEventListener('click', () => {
    errorNotification.classList.remove('show');
});

// Function to add message to chat
const addMessageToChat = (message) => {
    const { sender, senderId, content, timestamp } = message;
    
    // Create message div
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    // Set appropriate class based on message type
    if (senderId === 'self') {
        messageDiv.classList.add('self');
    } else if (senderId === 'system') {
        messageDiv.classList.add('system');
    }
    
    // Create message content
    if (senderId === 'system') {
        messageDiv.textContent = content;
    } else {
        messageDiv.innerHTML = `
            <div class="meta">
                <span>${sender}</span>
                <span class="time">${formatTime(timestamp)}</span>
            </div>
            <p class="text">${content}</p>
        `;
    }
    
    // Append to chat container
    chatMessages.appendChild(messageDiv);
    
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Store in message history if we have a selected friend
    if (selectedFriend && (senderId === 'self' || senderId === selectedFriend.id)) {
        if (!messageHistory.has(selectedFriend.id)) {
            messageHistory.set(selectedFriend.id, []);
        }
        messageHistory.get(selectedFriend.id).push(message);
    }
};

// Function to add a system message
const addSystemMessage = (content) => {
    addMessageToChat({
        sender: 'System',
        senderId: 'system',
        content,
        timestamp: new Date().toISOString()
    });
};

// Function to fetch friends from the server
const fetchFriends = async () => {
    try {
        friendsList.innerHTML = '<div class="loading-friends">Loading friends...</div>';
        
        const response = await fetch('/api/friends');
        const data = await response.json();
        
        if (data.friends) {
            friends = data.friends;
            renderFriendsList();
        } else {
            friendsList.innerHTML = '<div class="loading-friends">No friends found</div>';
        }
    } catch (error) {
        console.error('Error fetching friends:', error);
        friendsList.innerHTML = '<div class="loading-friends">Failed to load friends</div>';
        showError('Failed to load friends. Please try again later.');
    }
};

// Function to render the friends list
const renderFriendsList = () => {
    // Clear the friends list
    friendsList.innerHTML = '';
    
    if (friends.length === 0) {
        friendsList.innerHTML = '<div class="loading-friends">No friends found</div>';
        return;
    }
    
    // Filter friends based on search input
    const searchTerm = friendSearchInput.value.toLowerCase();
    const filteredFriends = friends.filter(friend => 
        friend.username.toLowerCase().includes(searchTerm)
    );
    
    if (filteredFriends.length === 0) {
        friendsList.innerHTML = '<div class="loading-friends">No matching friends</div>';
        return;
    }
    
    // Add each friend to the list
    filteredFriends.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.classList.add('friend-item');
        friendItem.dataset.id = friend.id;
        
        // If this is the selected friend, add the active class
        if (selectedFriend && selectedFriend.id === friend.id) {
            friendItem.classList.add('active');
        }
        
        // Create the friend item HTML
        friendItem.innerHTML = `
            <div class="friend-avatar">
                <img src="${friend.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${friend.username}">
            </div>
            <div class="friend-info">
                <div class="friend-name">${friend.username}</div>
                <div class="friend-source">${friend.source === 'dm' ? 'Direct Message' : 'Server: ' + (friend.guildName || 'Unknown')}</div>
            </div>
        `;
        
        // Add click event to select the friend
        friendItem.addEventListener('click', () => {
            selectFriend(friend);
        });
        
        // Add to the list
        friendsList.appendChild(friendItem);
    });
};

// Function to select a friend
const selectFriend = (friend) => {
    // Update the selected friend
    selectedFriend = friend;
    
    // Update the active class on friend items
    document.querySelectorAll('.friend-item').forEach(item => {
        if (item.dataset.id === friend.id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update the selected friend element
    selectedFriendElement.innerHTML = `
        <div class="friend-avatar" style="width: 24px; height: 24px;">
            <img src="${friend.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${friend.username}">
        </div>
        <span style="margin-left: 8px;">${friend.username}</span>
    `;
    
    // Enable the message input and button
    msgInput.disabled = false;
    document.querySelector('.btn').disabled = false;
    msgInput.focus();
    
    // Clear the chat messages
    chatMessages.innerHTML = '';
    
    // Add a system message indicating the new chat
    addSystemMessage(`You are now chatting securely with ${friend.username}`);
    
    // Load messages from history if available
    if (messageHistory.has(friend.id)) {
        const messages = messageHistory.get(friend.id);
        messages.forEach(msg => addMessageToChat(msg));
    }
    
    // Emit to server to select this friend for backend
    socket.emit('selectFriend', friend.id);
};

// Event listener for message form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get message text
    const msg = msgInput.value.trim();
    
    if (!msg) {
        return;
    }
    
    if (!selectedFriend) {
        showError('Please select a friend to chat with first');
        return;
    }
    
    // Emit message to server
    socket.emit('sendMessage', { message: msg });
    
    // Clear input field
    msgInput.value = '';
    msgInput.focus();
});

// Event listener for refresh friends button
refreshFriendsBtn.addEventListener('click', () => {
    refreshFriendsBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i>';
    fetchFriends().finally(() => {
        setTimeout(() => {
            refreshFriendsBtn.innerHTML = '<i class="fas fa-sync"></i>';
        }, 500);
    });
});

// Event listener for search input
friendSearchInput.addEventListener('input', renderFriendsList);

// Listen for messages from server
socket.on('message', (message) => {
    // Only add the message if it's from the selected friend or ourself
    if (!selectedFriend) return;
    
    if (message.senderId === 'self' || message.senderId === selectedFriend.id) {
        addMessageToChat(message);
    }
});

// Listen for friend selected confirmation
socket.on('friendSelected', (data) => {
    console.log('Friend selected:', data);
});

// Listen for real-time friend list updates
socket.on('friendsUpdate', (data) => {
    console.log('Received updated friends list:', data.friends.length);
    // Only update if we have new friends or different count
    if (data.friends.length !== friends.length) {
        friends = data.friends;
        renderFriendsList();
        
        // Show notification if we have more friends than before
        if (data.friends.length > 0) {
            showFriendUpdateNotification(data.friends.length);
        }
    }
});

// Listen for errors
socket.on('error', (data) => {
    showError(data.message);
});

// Auto-focus the search input when the page loads
window.addEventListener('load', () => {
    friendSearchInput.focus();
    
    // Add a welcome message
    addSystemMessage('Welcome to Secure Discord Chat! Select a friend to start chatting.');
    
    // Fetch friends
    fetchFriends();
}); 