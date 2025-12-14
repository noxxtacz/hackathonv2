'use client';

import './globals.css';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MusicManager } from '@/lib/music';

function Navbar() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Check localStorage for sound preference
    const stored = localStorage.getItem('soundEnabled');
    if (stored === 'true') {
      setSoundEnabled(true);
      MusicManager.play();
    }
  }, []);

  const toggleSound = () => {
    const newState = MusicManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        ✨ Nebula Village
      </Link>
      <div className="navbar-links">
        <Link href="/village">Village</Link>
        <Link href="/log">Write Log</Link>
        <Link href="/dashboard">Dashboard</Link>
        <button className="sound-toggle" onClick={toggleSound}>
          {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
        </button>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Nebula Village</title>
        <meta name="description" content="A cozy village for daily reflection and calm" />
      </head>
      <body>
        <Navbar />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
