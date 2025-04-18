import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compliot | HVAC Systems Compliance Agent",
  description: "Your AI Agent to handle compliance",
  icons: {
    icon: '/2.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
        style={{
          "--primary-color": "#FF6600",
          "--background-color": "white",
        } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
