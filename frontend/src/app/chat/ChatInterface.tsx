import { useState, useRef, useEffect } from 'react';

type Message = {
  content: string;
  isUser: boolean;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
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
    setMessages(prev => [...prev, { content: inputMessage, isUser: true }]);
    
    // Simulate AI response
    setInputMessage('');
    const response = await generateMockResponse(inputMessage);
    setMessages(prev => [...prev, { content: response, isUser: false }]);
  };

  return (
    <div className="flex flex-col h-screen  bg-white font-[family-name:var(--font-geist-sans)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.isUser
                  ? 'bg-[#FF6600] text-white'
                  : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
