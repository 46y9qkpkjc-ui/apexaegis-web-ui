import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LayoutShell } from '@/components/layout/layout-shell';
import { AiCommandCenter } from '@/components/ai/ai-command-center';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ApexAegis — Security Service Edge',
  description: 'Management Console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        <LayoutShell>{children}</LayoutShell>
        <AiCommandCenter />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
