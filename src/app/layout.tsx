import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAREGRAPH AI - Indian Voice & Knowledge Graph Healthcare Triage",
  description: "Autonomous Multilingual Indian Voice & Knowledge Graph Healthcare Triage System powered by FalkorDB, LiveKit, and Murf Falcon.",
  keywords: ["Healthcare AI", "CAREGRAPH AI", "Voice Assistant", "Murf Falcon", "FalkorDB", "Cypher", "LiveKit", "Indian Healthcare"],
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
