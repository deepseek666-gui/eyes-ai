document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loadingScreen = document.getElementById('loadingScreen');
  const mainApp = document.getElementById('mainApp');
  const newChatBtn = document.getElementById('newChatBtn');
  const chatHistory = document.getElementById('chatHistory');
  const messagesContainer = document.getElementById('messagesContainer');
  const inputBox = document.getElementById('inputBox');
  const sendBtn = document.getElementById('sendBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const themeSelect = document.getElementById('themeSelect');
  const animationSelect = document.getElementById('animationSelect');
  
  // State
  let currentChatId = generateId();
  let chats = JSON.parse(localStorage.getItem('eyes-chats')) || [];
  let settings = JSON.parse(localStorage.getItem('eyes-settings')) || {
    theme: 'system',
    animation: 'full'
  };
  
  // Initialize
  initializeTheme();
  initializeAnimations();
  loadChatHistory();
  
  // Simulate loading
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    
    mainApp.style.display = 'flex';
    setTimeout(() => {
      mainApp.style.opacity = '1';
    }, 100);
    
    // Show welcome message if new user
    if (chats.length === 0) {
      setTimeout(() => {
        addAIMessage(`Hello! I'm EYES, your visionary AI companion. What would you like to explore today?`);
      }, 500);
    }
  }, 2500);
  
  // Event Listeners
  newChatBtn.addEventListener('click', startNewChat);
  sendBtn.addEventListener('click', sendMessage);
  inputBox.addEventListener('keydown', handleKeyDown);
  settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
  closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
  themeSelect.addEventListener('change', updateTheme);
  animationSelect.addEventListener('change', updateAnimations);
  
  // Functions
  function initializeTheme() {
    themeSelect.value = settings.theme;
    
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }
  
  function initializeAnimations() {
    animationSelect.value = settings.animation;
    // Implementation would vary based on animation preferences
  }
  
  function loadChatHistory() {
    chatHistory.innerHTML = '';
    
    chats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = `chat-history-item ${chat.id === currentChatId ? 'active' : ''}`;
      chatItem.textContent = chat.title || 'New Vision';
      chatItem.addEventListener('click', () => loadChat(chat.id));
      chatHistory.appendChild(chatItem);
    });
  }
  
  function startNewChat() {
    currentChatId = generateId();
    chats.push({
      id: currentChatId,
      title: 'New Vision',
      messages: [],
      createdAt: new Date().toISOString()
    });
    
    saveChats();
    loadChatHistory();
    messagesContainer.innerHTML = '';
    
    // Add welcome message
    setTimeout(() => {
      addAIMessage(`Hello! I'm EYES, your visionary AI companion. What would you like to explore today?`);
    }, 300);
  }
  
  function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    currentChatId = chatId;
    messagesContainer.innerHTML = '';
    
    chat.messages.forEach(message => {
      if (message.role === 'user') {
        addUserMessage(message.content);
      } else {
        addAIMessage(message.content);
      }
    });
    
    loadChatHistory();
  }
  
  function sendMessage() {
    const message = inputBox.textContent.trim();
    if (!message) return;
    
    addUserMessage(message);
    inputBox.textContent = '';
    
    // Add to chat history
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    if (chatIndex !== -1) {
      chats[chatIndex].messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      // Update title if it's the first message
      if (chats[chatIndex].title === 'New Vision') {
        chats[chatIndex].title = message.length > 30 ? `${message.substring(0, 30)}...` : message;
        loadChatHistory();
      }
      
      saveChats();
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to API
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          ...chats[chatIndex].messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ]
      })
    })
    .then(response => response.json())
    .then(data => {
      hideTypingIndicator();
      
      if (data.choices && data.choices.length > 0) {
        const aiMessage = data.choices[0].message.content;
        addAIMessage(aiMessage);
        
        // Add to chat history
        if (chatIndex !== -1) {
          chats[chatIndex].messages.push({
            role: 'assistant',
            content: aiMessage,
            timestamp: new Date().toISOString()
          });
          saveChats();
        }
      }
    })
    .catch(error => {
      hideTypingIndicator();
      console.error('Error:', error);
      addAIMessage("I'm having trouble connecting to the cognitive network. Please try again later.");
    });
  }
  
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message slide-up';
    messageElement.innerHTML = `
      ${message}
      <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  function addAIMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message slide-up';
    messageElement.innerHTML = `
      ${message}
      <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
  }
  
  function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
  
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  function saveChats() {
    localStorage.setItem('eyes-chats', JSON.stringify(chats));
  }
  
  function updateTheme() {
    settings.theme = themeSelect.value;
    localStorage.setItem('eyes-settings', JSON.stringify(settings));
    
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }
  
  function updateAnimations() {
    settings.animation = animationSelect.value;
    localStorage.setItem('eyes-settings', JSON.stringify(settings));
    // Implementation would vary based on animation preferences
  }
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (settings.theme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
});
