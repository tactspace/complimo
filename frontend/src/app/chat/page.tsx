"use client";
import Navbar from "../Navbar";
import ChatInterface from './ChatInterface';
import FileUpload from './FileUpload';
import ComplianceList from './ComplianceList';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-white font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Panel - File Upload */}
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

        {/* Main Compliance List - Now Center Stage */}
        <div className="flex-1 border-r border-gray-100 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Compliance Requirements</h1>
            <ComplianceList />
          </div>
        </div>

        {/* Right Panel - Compact Chat */}
        <div className="w-96 border-l border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600">Compliance Assistant</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
