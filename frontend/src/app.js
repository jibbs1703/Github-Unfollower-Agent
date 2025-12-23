// Configuration
const CONFIG = {
    API_BASE: '/api/v1',
    SESSION_TIMEOUT_MS: 60 * 60 * 1000, // 1 hour
    MESSAGE_MAX_LENGTH: 1000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 1000,
};

// Application State
const state = {
    sessionId: null,
    username: null,
    isLoading: false,
    messageHistory: [],
};

const elements = {
    authSection: document.getElementById('auth-section'),
    authForm: document.getElementById('auth-form'),
    usernameInput: document.getElementById('username'),
    tokenInput: document.getElementById('token'),
    toggleTokenBtn: document.getElementById('toggle-token'),
    connectBtn: document.getElementById('connect-btn'),
    authError: document.getElementById('auth-error'),
    
    chatSection: document.getElementById('chat-section'),
    chatForm: document.getElementById('chat-form'),
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    connectedUser: document.getElementById('connected-user'),
    userAvatar: document.getElementById('user-avatar'),
    logoutBtn: document.getElementById('logout-btn'),
    quickActionBtns: document.querySelectorAll('.btn-action'),
    
    loadingOverlay: document.getElementById('loading-overlay'),
};

async function apiRequest(endpoint, options = {}, retries = CONFIG.RETRY_ATTEMPTS) {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const fetchOptions = { ...defaultOptions, ...options };
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.detail || `Request failed with status ${response.status}`,
                    response.status
                );
            }
            
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            
            if (attempt === retries) {
                throw new ApiError('Network error. Please check your connection.', 0);
            }
            
            await sleep(CONFIG.RETRY_DELAY_MS * attempt);
        }
    }
}

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatMessage(text) {
    let formatted = escapeHtml(text);
    
    formatted = formatted.replace(/\n/g, '<br>');
    
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return formatted;
}

function setLoading(isLoading, showOverlay = false) {
    state.isLoading = isLoading;
    
    elements.connectBtn.disabled = isLoading;
    elements.sendBtn.disabled = isLoading;
    
    const connectBtnText = elements.connectBtn.querySelector('.btn-text');
    const connectBtnLoading = elements.connectBtn.querySelector('.btn-loading');
    const sendBtnText = elements.sendBtn.querySelector('.btn-text');
    const sendBtnLoading = elements.sendBtn.querySelector('.btn-loading');
    
    if (isLoading) {
        connectBtnText?.classList.add('hidden');
        connectBtnLoading?.classList.remove('hidden');
        sendBtnText?.classList.add('hidden');
        sendBtnLoading?.classList.remove('hidden');
    } else {
        connectBtnText?.classList.remove('hidden');
        connectBtnLoading?.classList.add('hidden');
        sendBtnText?.classList.remove('hidden');
        sendBtnLoading?.classList.add('hidden');
    }
    
    if (showOverlay) {
        elements.loadingOverlay.classList.toggle('hidden', !isLoading);
    }
}

function showAuthError(message) {
    elements.authError.textContent = message;
    elements.authError.classList.remove('hidden');
}

function hideAuthError() {
    elements.authError.classList.add('hidden');
}

function addMessage(type, content, isHtml = false) {
    const welcomeMessage = elements.chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (isHtml) {
        messageDiv.innerHTML = content;
    } else {
        messageDiv.innerHTML = formatMessage(content);
    }
    
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    state.messageHistory.push({ type, content, timestamp: Date.now() });
    
    return messageDiv;
}

function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent loading';
    messageDiv.id = 'loading-message';
    messageDiv.textContent = 'Thinking';
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function clearChat() {
    elements.chatMessages.innerHTML = `
        <div class="welcome-message">
            <p>Welcome! I can help you manage your GitHub following. Try asking:</p>
            <ul>
                <li>"Who doesn't follow me back?"</li>
                <li>"Show my follower statistics"</li>
                <li>"Unfollow all non-followers"</li>
            </ul>
        </div>
    `;
    state.messageHistory = [];
}

async function authenticate(username, token) {
    setLoading(true);
    hideAuthError();
    
    try {
        const data = await apiRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({ username, token }),
        });
        
        state.sessionId = data.session_id;
        state.username = data.username;
        
        elements.connectedUser.textContent = data.username;
        elements.authSection.classList.add('hidden');
        elements.chatSection.classList.remove('hidden');
        
        elements.messageInput.focus();
        
        addMessage('agent', `Connected successfully as **${data.username}**! How can I help you manage your GitHub following?`);
        
    } catch (error) {
        console.error('Authentication error:', error);
        showAuthError(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
        setLoading(false);
    }
}

async function logout() {
    if (state.sessionId) {
        try {
            await apiRequest(`/session/${state.sessionId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    state.sessionId = null;
    state.username = null;
    
    elements.chatSection.classList.add('hidden');
    elements.authSection.classList.remove('hidden');
    
    elements.authForm.reset();
    clearChat();
    hideAuthError();
    
    elements.usernameInput.focus();
}

async function sendMessage(message) {
    if (!message.trim() || state.isLoading || !state.sessionId) {
        return;
    }
    
    if (message.length > CONFIG.MESSAGE_MAX_LENGTH) {
        addMessage('error', `Message too long. Maximum ${CONFIG.MESSAGE_MAX_LENGTH} characters.`);
        return;
    }
    
    addMessage('user', message);
    
    elements.messageInput.value = '';
    
    setLoading(true);
    const loadingMessage = addLoadingMessage();
    
    try {
        const data = await apiRequest('/chat', {
            method: 'POST',
            body: JSON.stringify({
                session_id: state.sessionId,
                message: message,
            }),
        });
        
        removeLoadingMessage();
        
        addMessage('agent', data.response);
        
    } catch (error) {
        console.error('Chat error:', error);
        removeLoadingMessage();
        
        if (error.status === 401) {
            addMessage('error', 'Session expired. Please reconnect.');
            setTimeout(() => logout(), 2000);
            return;
        }
        
        addMessage('error', error.message || 'Failed to get response. Please try again.');
    } finally {
        setLoading(false);
        elements.messageInput.focus();
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();
    
    const username = elements.usernameInput.value.trim();
    const token = elements.tokenInput.value.trim();
    
    if (!username || !token) {
        showAuthError('Please enter both username and token.');
        return;
    }
    
    authenticate(username, token);
}

function handleChatSubmit(event) {
    event.preventDefault();
    
    const message = elements.messageInput.value.trim();
    sendMessage(message);
}

function handleQuickAction(event) {
    const action = event.target.dataset.action;
    if (action) {
        elements.messageInput.value = action;
        sendMessage(action);
    }
}

function handleToggleToken() {
    const isPassword = elements.tokenInput.type === 'password';
    elements.tokenInput.type = isPassword ? 'text' : 'password';
    elements.toggleTokenBtn.querySelector('.icon-eye').textContent = isPassword ? '🙈' : '👁';
}

function handleLogout() {
    if (confirm('Are you sure you want to disconnect?')) {
        logout();
    }
}

function handleKeyboard(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (state.sessionId && elements.messageInput === document.activeElement) {
            handleChatSubmit(event);
        }
    }
    
    if (event.key === 'Escape' && !elements.loadingOverlay.classList.contains('hidden')) {
        setLoading(false, true);
    }
}

function init() {
    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.chatForm.addEventListener('submit', handleChatSubmit);
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.toggleTokenBtn.addEventListener('click', handleToggleToken);
    
    elements.quickActionBtns.forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    document.addEventListener('keydown', handleKeyboard);
    
    elements.usernameInput.focus();
    
    console.log('GitHub Unfollower Agent initialized');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
