"use client";

export default function FileUpload() {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log('Files uploaded:', files);
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
          Click to upload or drag and drop
        </div>
      </label>
    </div>
  );
} 