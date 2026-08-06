import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwasthyaSathi AI - Indian Voice Healthcare Assistant",
  description: "Experience 24/7 AI-powered medical voice assistance with natural Indian English Murf Falcon text-to-speech and LiveKit WebRTC real-time connectivity.",
  keywords: ["Healthcare AI", "SwasthyaSathi AI", "Voice Assistant", "Murf Falcon Voice", "Indian English TTS", "LiveKit WebRTC", "OpenAI Health"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-[#090d16] text-slate-100 selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
