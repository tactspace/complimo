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
    setMessages(prev => [...prev, { 
      id: Date.now(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    }]);
    
    // Simulate AI response
    setInputMessage('');
    const response = await generateMockResponse(inputMessage);
    setMessages(prev => [...prev, { 
      id: Date.now(),
      content: response,
      isUser: false,
      timestamp: new Date()
    }]);
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
            className="flex-1 p-3 border text-black rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6600] pl-6"
            autoFocus
          />
          <button
            onClick={handleSend}
            className="px-8 py-3 bg-[#FF6600] text-white rounded-full font-semibold hover:bg-[#FF6600]/90 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock AI response generator
async function generateMockResponse(prompt: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  return "This is a mock response from the AI. In a real implementation, this would be connected to an AI API endpoint.";
}
