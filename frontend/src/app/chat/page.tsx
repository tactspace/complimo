"use client";
import Navbar from "../Navbar";
import ChatInterface from './ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-white font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface className="flex-1 overflow-y-auto" />
      </div>
    </div>
  );
}
