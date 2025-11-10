import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rift Rewind - League of Legends Recap',
  description: 'Your personalized League of Legends recap generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

