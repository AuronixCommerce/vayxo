import type { Metadata } from 'next';
import './globals.css';
import { AiDock } from '@/components/ex/ai-dock';
import { AuthProvider } from '@/components/ex/auth-provider';
import { CookieBanner } from '@/components/ex/cookie-banner';
export const metadata: Metadata = { applicationName:'VAYXO.online', title: { default: 'VAYXO.online — what’s happening now', template: '%s · VAYXO.online' }, description: 'Join the conversation, follow what matters, and share what’s next on VAYXO.online.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body><AuthProvider>{children}<AiDock/><CookieBanner/></AuthProvider></body></html>; }
