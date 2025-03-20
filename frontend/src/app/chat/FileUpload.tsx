"use client";
import { useState } from 'react';

export default function FileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsLoading(true);
      setIsSuccess(false);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('http://0.0.0.0:8000/index-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload files');
        }
        console.log('Files successfully indexed:', await response.json());
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000); // Hide success after 3 seconds
      } catch (error) {
        console.error('Error uploading files:', error);
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#FF6600] transition-colors">
      <input
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-gray-500 text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#FF6600] border-t-transparent rounded-full animate-spin"></div>
              Uploading...
            </div>
          ) : isSuccess ? (
            <div className="text-green-500">✓ Upload complete!</div>
          ) : (
            'Click to upload or drag and drop'
          )}
        </div>
      </label>
    </div>
  );
} 