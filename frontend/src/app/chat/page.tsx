"use client";
import Navbar from "../Navbar";
import ChatInterface from './ChatInterface';
import FileUpload from "./FileUpload";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-white font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Side Panel */}
        <div className="w-64 border-r border-gray-100 p-4 bg-gray-100 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Upload Documents</h2>
          <FileUpload />
          <div className="mt-4 text-sm text-gray-500">
            <p className="mb-2">Supported formats:</p>
            <ul className="list-disc pl-4">
              <li>PDF</li>
              <li>DOC/DOCX</li>
              <li>TXT</li>
            </ul>
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface className="flex-1 overflow-y-auto" />
        </div>
      </div>
    </div>
  );
}
