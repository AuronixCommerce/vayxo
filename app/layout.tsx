import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AiDock } from '@/components/ex/ai-dock';
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: { default: 'eX — what’s happening now', template: '%s · eX' }, description: 'Join the conversation, follow what matters, and share what’s next on eX.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${geist.variable} ${mono.variable}`}>{children}<AiDock/></body></html>; }
