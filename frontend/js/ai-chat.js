/**
 * NUTRATEIN — Floating AI Product Recommendation Chat Assistant
 * Multi-language support: English, Hindi, Marathi
 * Live database product search with interactive recommendation cards
 */

let aiChatOpen = false;
let aiChatLanguage = 'en';

// Greetings by language
const aiGreetings = {
  en: "Hi there! I am your **Nutratein AI Assistant**. Ask me anything about our supplements, finding the right protein for your goals, or recommendations within your budget!",
  hi: "नमस्ते! मैं आपका **Nutratein AI असिस्टेंट** हूँ। अपने फिटनेस लक्ष्यों के लिए सही प्रोटीन चुनने, सप्लीमेंट्स की जानकारी लेने या बजट के अनुसार सुझाव पाने के लिए कुछ भी पूछें!",
  mr: "नमस्कार! मी तुमचा **Nutratein AI सहाय्यक** आहे. तुमच्या उद्दिष्टांनुसार योग्य सप्लीमेंट्स निवडण्यासाठी, व्हे प्रोटीन किंवा बजेटमधील उत्पादनांची माहिती मिळवण्यासाठी मला विचारा!"
};

// Initial suggestions by language
const aiDefaultSuggestions = {
  en: ['Best protein for muscle', 'Products under ₹2000', 'What is Creatine?', 'Build a Stack'],
  hi: ['मांसपेशियों के लिए सबसे अच्छा प्रोटीन', '₹2000 के अंदर सप्लीमेंट्स', 'क्रिएटिन क्या है?', 'स्टैक कैसे बनाएं?'],
  mr: ['स्नायू वाढवण्यासाठी सर्वोत्तम प्रोटीन', '₹२००० च्या आतील उत्पादने', 'क्रिएटिन काय आहे?', 'स्टॅक कसा बनवायचा?']
};

// Initialize and inject AI Chat widget HTML into the page
function initAIChat() {
  if (document.getElementById('ai-chat-container')) return;

  aiChatLanguage = (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : localStorage.getItem('proteinx_lang')) || 'en';

  const container = document.createElement('div');
  container.id = 'ai-chat-container';
  container.innerHTML = `
    <!-- Floating Trigger Button -->
    <button class="ai-chat-btn" id="ai-chat-btn" onclick="toggleAIChat()" aria-label="Ask our AI Assistant">
      <span class="ai-sparkle">✨</span>
      <span class="ai-btn-text" data-i18n="ai_chat_btn">Ask our AI</span>
    </button>

    <!-- Chat Modal Window -->
    <div class="ai-chat-window" id="ai-chat-window">
      <!-- Header -->
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="ai-chat-avatar">PX</div>
          <div>
            <div class="ai-chat-title">Nutratein AI Assistant</div>
            <div class="ai-chat-sub">Find the right products for your needs</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="ai-chat-lang-pills">
            <button class="ai-lang-pill ${aiChatLanguage === 'en' ? 'active' : ''}" onclick="setAIChatLanguage('en')">EN</button>
            <button class="ai-lang-pill ${aiChatLanguage === 'hi' ? 'active' : ''}" onclick="setAIChatLanguage('hi')">हिन्दी</button>
            <button class="ai-lang-pill ${aiChatLanguage === 'mr' ? 'active' : ''}" onclick="setAIChatLanguage('mr')">मराठी</button>
          </div>
          <button onclick="toggleAIChat()" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-muted); padding: 0 4px;">&times;</button>
        </div>
      </div>

      <!-- Messages Body -->
      <div class="ai-chat-body" id="ai-chat-body">
        <div class="ai-chat-msg ai" id="ai-greeting-msg">
          ${formatMarkdown(aiGreetings[aiChatLanguage] || aiGreetings.en)}
        </div>
        <div class="ai-suggestions-wrap" id="ai-suggestions-wrap"></div>
      </div>

      <!-- Footer Input -->
      <form class="ai-chat-footer" onsubmit="handleAIChatSubmit(event)">
        <input type="text" id="ai-chat-input" class="ai-chat-input" placeholder="Ask about protein, budget, goals..." autocomplete="off">
        <button type="submit" class="ai-chat-send-btn" title="Send message">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(container);
  renderAISuggestions(aiDefaultSuggestions[aiChatLanguage] || aiDefaultSuggestions.en);
}

// Toggle Chat open/close
function toggleAIChat() {
  const win = document.getElementById('ai-chat-window');
  if (!win) return;
  aiChatOpen = !aiChatOpen;
  win.classList.toggle('open', aiChatOpen);
  if (aiChatOpen) {
    document.getElementById('ai-chat-input')?.focus();
  }
}

// Switch Chat Language
function setAIChatLanguage(lang) {
  aiChatLanguage = lang;
  document.querySelectorAll('.ai-lang-pill').forEach(pill => {
    pill.classList.toggle('active', pill.textContent.toLowerCase() === lang || (lang === 'hi' && pill.textContent === 'हिन्दी') || (lang === 'mr' && pill.textContent === 'मराठी'));
  });

  const greetingEl = document.getElementById('ai-greeting-msg');
  if (greetingEl) {
    greetingEl.innerHTML = formatMarkdown(aiGreetings[lang] || aiGreetings.en);
  }

  renderAISuggestions(aiDefaultSuggestions[lang] || aiDefaultSuggestions.en);
}

// Render Suggestion Chips
function renderAISuggestions(list) {
  const wrap = document.getElementById('ai-suggestions-wrap');
  if (!wrap) return;
  wrap.innerHTML = (list || []).map(text => `
    <button class="ai-chip" onclick="askAIChatPrompt('${escapeHtml(text)}')">${escapeHtml(text)}</button>
  `).join('');
}

// Send quick suggestion prompt
function askAIChatPrompt(promptText) {
  const input = document.getElementById('ai-chat-input');
  if (input) input.value = promptText;
  handleAIChatSubmit(new Event('submit'));
}

// Simple markdown formatter (**bold**)
function formatMarkdown(text) {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Escape HTML utility
function escapeHtml(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Handle Message Submission
async function handleAIChatSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const body = document.getElementById('ai-chat-body');
  if (!input || !body) return;

  const msg = input.value.trim();
  if (!msg) return;

  // Append user message
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'ai-chat-msg user';
  userMsgEl.textContent = msg;
  body.appendChild(userMsgEl);

  input.value = '';
  body.scrollTop = body.scrollHeight;

  // Append typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'ai-chat-msg ai';
  typingEl.id = 'ai-typing-indicator';
  typingEl.innerHTML = '<span style="opacity: 0.7;">Thinking...</span>';
  body.appendChild(typingEl);
  body.scrollTop = body.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        language: aiChatLanguage
      })
    });
    const data = await res.json();

    typingEl.remove();

    if (data.success) {
      // Append AI response
      const aiMsgEl = document.createElement('div');
      aiMsgEl.className = 'ai-chat-msg ai';

      let html = `<div>${formatMarkdown(data.reply)}</div>`;

      // Render products cards inside the chat
      if (data.products && data.products.length > 0) {
        html += `<div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">`;
        data.products.forEach(p => {
          html += `
            <div class="ai-chat-product-card">
              <img src="${p.image}" alt="${p.name}" class="ai-chat-product-img">
              <div class="ai-chat-product-info">
                <div class="ai-chat-product-name" title="${p.name}">${p.name}</div>
                <div class="ai-chat-product-price">₹${p.basePrice.toLocaleString('en-IN')} <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">(${p.rating}★)</span></div>
                <div style="font-size: 0.6875rem; color: var(--text-secondary); margin-top: 2px;">${p.reason || ''}</div>
                <div class="ai-chat-product-actions">
                  <a href="product.html?slug=${p.slug}" class="ai-chat-btn-view">View</a>
                  <button class="ai-chat-btn-cart" onclick="quickAddToCart('${p._id}')">+ Cart</button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }

      aiMsgEl.innerHTML = html;
      body.appendChild(aiMsgEl);

      // Render new suggestion chips
      if (data.suggestions && data.suggestions.length > 0) {
        renderAISuggestions(data.suggestions);
      }
    } else {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'ai-chat-msg ai';
      errorMsg.textContent = "I'm having a little trouble connecting to the catalog. Please try again or browse our Shop page.";
      body.appendChild(errorMsg);
    }
  } catch (err) {
    typingEl.remove();
    const errorMsg = document.createElement('div');
    errorMsg.className = 'ai-chat-msg ai';
    errorMsg.textContent = "I'm having a little trouble connecting. Please check your connection or browse our Shop page.";
    body.appendChild(errorMsg);
  }

  body.scrollTop = body.scrollHeight;
}

// Auto init on page load
document.addEventListener('DOMContentLoaded', () => {
  initAIChat();
});
