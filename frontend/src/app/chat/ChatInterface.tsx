import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp?: Date;
}

const mockMessages: Message[] = [
  {
    id: 1,
    content: "Welcome to Complimo! How can I assist you today?",
    isUser: false,
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: 2,
    content: "I need help with compliance regulations.",
    isUser: true,
    timestamp: new Date(Date.now() - 30000)
  },
  {
    id: 3,
    content: "I'd be happy to help. Could you specify which industry or region you're referring to?",
    isUser: false,
    timestamp: new Date(Date.now() - 15000)
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage = { 
      id: Date.now(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    // Create updated messages array with the new user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Clear input
    const userQuery = inputMessage;
    setInputMessage('');
    
    try {
      // Pass both the query and conversation history to the API
      const response = await fetchChatResponse(userQuery, updatedMessages);
      setMessages(prev => [...prev, { 
        id: Date.now(),
        content: response,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      // Handle error in case API call fails
      console.error("Error fetching response:", error);
      setMessages(prev => [...prev, { 
        id: Date.now(),
        content: "Sorry, I couldn't process your request. Please try again later.",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen  bg-white font-[family-name:var(--font-geist-sans)]">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[50%] p-3 ${
                  message.isUser
                    ? 'bg-[#FF6600] text-white rounded-xl rounded-br-sm ml-6'
                    : 'bg-gray-300 rounded-xl rounded-tl-sm mr-6'
                }`}
              >
                <p className={`text-sm leading-snug ${message.isUser ? 'text-white' : 'text-gray-600'}`}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t p-4 bg-gray-50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-2 text-sm border text-black rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6600] pl-4"
            autoFocus
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-[#FF6600] text-white rounded-full text-sm font-medium hover:bg-[#FF6600]/90 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Modify fetchChatResponse to include conversation history
async function fetchChatResponse(query: string, messageHistory: Message[]): Promise<string> {
  try {
    // Format conversation history to send to the API
    const conversationHistory = messageHistory.map(msg => ({
      content: msg.content,
      isUser: msg.isUser
    }));

    console.log("History", conversationHistory);

    const response = await fetch('http://0.0.0.0:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        conversation_history: conversationHistory 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || "No response received";
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}
