import Image from "next/image";
import Navbar from "./Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Include the Navbar component */}
      <Navbar />

      {/* Main Content - Welcome Text */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-6">Welcome to Complimo</h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">Your modern solution for your compliance needs.</p>
          <div className="h-1 w-24 bg-[#FF6600] mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-gray-700 mb-10">
            We're excited to have you here. Explore our services and discover how we can help you achieve your goals.
          </p>
          <a
            href="/chat"
            className="inline-block rounded-full bg-[#FF6600] text-white px-8 py-3 font-semibold text-lg transition-all hover:bg-[#FF6600]/90 hover:shadow-lg"
          >
            Get Started
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-[24px] flex-wrap items-center justify-center text-gray-600 text-sm">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-[#FF6600] font-medium transition-colors"
            href="#"
          >
            Terms
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-[#FF6600] font-medium transition-colors"
            href="#"
          >
            Privacy
          </a>
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-[#FF6600] font-medium transition-colors"
            href="#"
          >
            Contact
          </a>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">© 2023 Complimo. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
