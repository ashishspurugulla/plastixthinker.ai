// AI Chat functionality for PlastixThinker
document.addEventListener('DOMContentLoaded', function() {
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const sendButton = document.getElementById('sendButton');
  const typingIndicator = document.getElementById('typingIndicator');

  // Auto-resize textarea
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Handle form submission
  chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;

    await sendMessage(message);
  });

  // Global function for quick actions
  window.askQuestion = async function(question) {
    await sendMessage(question);
  };

  // Send message function
  async function sendMessage(message) {
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input and reset height
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Disable send button and show typing indicator
    sendButton.disabled = true;
    showTypingIndicator();

    try {
      // Send message to server
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.answer) {
        addMessage(data.answer, 'ai');
      } else {
        throw new Error(data.error || 'No response from AI');
      }

    } catch (error) {
      console.error('Error:', error);
      addMessage('I apologize, but I\'m having trouble connecting to the server right now. Please ensure the server is running (npm start) and try again. If the issue persists, please check your internet connection.', 'ai');
    } finally {
      hideTypingIndicator();
      sendButton.disabled = false;
      chatInput.focus();
    }
  }

  // Add message to chat
  function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom with smooth animation
    setTimeout(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  // Show typing indicator
  function showTypingIndicator() {
    typingIndicator.classList.add('show');
    setTimeout(() => {
      chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
  }

  // Handle Enter key (submit on Enter, new line on Shift+Enter)
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // Add helpful tips after initial load
  setTimeout(() => {
    addMessage('💡 Tip: Click any quick action button on the left to ask common questions, or type your own question below. I\'m here to help you learn about microplastics and environmental solutions!', 'ai');
  }, 1500);

  // Add another helpful tip after a delay
  setTimeout(() => {
    addMessage('🔍 You can ask me about specific topics like "microplastic detection methods", "biodegradable alternatives", or "ocean cleanup technologies". What interests you most?', 'ai');
  }, 4000);
});
  