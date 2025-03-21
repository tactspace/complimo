import React from "react";
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="w-full bg-[#FF6600] text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <Link href="/" className=" flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Complimo Logo" 
            width={24} 
            height={24}
            className="h-6 w-auto"
          />
          <span className="font-bold text-xl tracking-tight">Complimo</span>
        </Link>
      </div>
      <div className="flex gap-6 font-medium text-sm uppercase tracking-wider">
        <Link href="/chat" className="py-1  transition-all duration-300 hover:drop-shadow-glow-white">Monitor Compliance</Link>
        <Link href="/" className="py-1  transition-all duration-300 hover:drop-shadow-glow-white">Home</Link>
        <a href="https://www.belimo.com/ch/en_GB/about/belimo/profile" className="py-1">About</a>
        <a href="https://www.belimo.com/ch/en_GB/contact/channels/belimo-contacts" className="py-1">Contact</a>
      </div>
    </nav>
  );
}