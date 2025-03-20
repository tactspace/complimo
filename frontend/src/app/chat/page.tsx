import Navbar from "../Navbar";

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">Complimo Chat</h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">Your AI-powered compliance assistant</p>
          <div className="h-1 w-24 bg-[#FF6600] mx-auto mb-8 rounded-full"></div>
          <div className="border rounded-lg p-4 min-h-[400px] w-full max-w-3xl">
            {/* Chat interface will be added here */}
            <p className="text-gray-500">Chat feature coming soon...</p>
          </div>
        </div>
      </div>

      {/* Reuse footer from homepage */}
      <footer className="w-full py-6 px-4 bg-gray-50 border-t border-gray-100">
        // ... existing footer code from homepage ...
      </footer>
    </div>
  );
} 