import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full bg-[#FF6600] text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center">
        <span className="font-bold text-xl tracking-tight">Complimo</span>
      </div>
      <div className="flex gap-6 font-medium text-sm uppercase tracking-wider">
        <a href="#" className="hover:underline hover:underline-offset-4 py-1">Home</a>
        <a href="#" className="hover:underline hover:underline-offset-4 py-1">About</a>
        <a href="#" className="hover:underline hover:underline-offset-4 py-1">Services</a>
        <a href="#" className="hover:underline hover:underline-offset-4 py-1">Contact</a>
      </div>
    </nav>
  );
}