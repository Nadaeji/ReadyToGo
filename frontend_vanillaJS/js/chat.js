// Chat module
const ChatModule = {
  elements: {
    chatMessages: document.getElementById("chatMessages"),
    messageInput: document.getElementById("messageInput"),
    sendButton: document.getElementById("sendButton"),
    chatInputContainer: document.getElementById("chatInputContainer"),
    welcomeMessage: document.getElementById("welcomeMessage"),
  },

  messages: [],
  isLoading: false,
}

// Assuming AppState is defined elsewhere, possibly in another module or script
// For example:
// const AppState = { chatConfig: { country: null, topic: null, aiModel: null } };
// Or import it if it's in another module:
// import { AppState } from './appState';

function initChat() {
  setupChatEventListeners()
  updateChatUI()
}

function setupChatEventListeners() {
  // Send message on button click
  ChatModule.elements.sendButton.addEventListener("click", sendMessage)

  // Send message on Enter key
  ChatModule.elements.messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  // Listen for configuration changes
  window.addEventListener("configChanged", (e) => {
    updateChatUI()
  })
}

function updateChatUI() {
  const isConfigured = AppState.chatConfig.country && AppState.chatConfig.topic

  if (isConfigured) {
    ChatModule.elements.welcomeMessage.style.display = "none"
    ChatModule.elements.chatInputContainer.style.display = "block"

    // Show initial message if no messages yet
    if (ChatModule.messages.length === 0) {
      addMessage(
        "assistant",
        `Hi! I'm your travel assistant for ${AppState.chatConfig.country}. Ask me anything about ${AppState.chatConfig.topic.toLowerCase()}.`,
      )
    }
  } else {
    ChatModule.elements.welcomeMessage.style.display = "flex"
    ChatModule.elements.chatInputContainer.style.display = "none"
  }
}

async function sendMessage() {
  const message = ChatModule.elements.messageInput.value.trim()
  if (!message || ChatModule.isLoading) return

  // Add user message
  addMessage("user", message)
  ChatModule.elements.messageInput.value = ""

  // Show typing indicator
  showTypingIndicator()
  ChatModule.isLoading = true

  try {
    // Simulate API call - replace with actual API endpoint
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: ChatModule.messages,
        country: AppState.chatConfig.country,
        topic: AppState.chatConfig.topic,
        model: AppState.chatConfig.aiModel,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get response")
    }

    // Handle streaming response
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ""

    hideTypingIndicator()
    const messageElement = addMessage("assistant", "")

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              assistantMessage += data.content
              updateMessage(messageElement, assistantMessage)
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  } catch (error) {
    hideTypingIndicator()
    addMessage("assistant", "Sorry, I encountered an error. Please try again.")
    console.error("Chat error:", error)
  } finally {
    ChatModule.isLoading = false
  }
}

function addMessage(role, content) {
  const message = { role, content, id: Date.now() }
  ChatModule.messages.push(message)

  const messageElement = document.createElement("div")
  messageElement.className = `message ${role}`
  messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${role === "user" ? "user" : "robot"}"></i>
        </div>
        <div class="message-content">${content}</div>
    `

  ChatModule.elements.chatMessages.appendChild(messageElement)
  ChatModule.elements.chatMessages.scrollTop = ChatModule.elements.chatMessages.scrollHeight

  return messageElement
}

function updateMessage(messageElement, content) {
  const contentElement = messageElement.querySelector(".message-content")
  contentElement.textContent = content
  ChatModule.elements.chatMessages.scrollTop = ChatModule.elements.chatMessages.scrollHeight
}

function showTypingIndicator() {
  const typingElement = document.createElement("div")
  typingElement.className = "message assistant typing-indicator"
  typingElement.id = "typingIndicator"
  typingElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `

  ChatModule.elements.chatMessages.appendChild(typingElement)
  ChatModule.elements.chatMessages.scrollTop = ChatModule.elements.chatMessages.scrollHeight
}

function hideTypingIndicator() {
  const typingElement = document.getElementById("typingIndicator")
  if (typingElement) {
    typingElement.remove()
  }
}
