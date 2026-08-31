import type { Metadata } from 'next';
import './globals.css';
import { AiDock } from '@/components/ex/ai-dock';
import { AuthProvider } from '@/components/ex/auth-provider';
import { CookieBanner } from '@/components/ex/cookie-banner';
import { AuthGate } from '@/components/ex/auth-gate';
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||process.env.APP_URL||'https://vayxo.online';
export const metadata: Metadata = { metadataBase:new URL(siteUrl), applicationName:'VAYXO.online', title: { default: 'VAYXO.online — what’s happening now', template: '%s · VAYXO.online' }, description: 'Join the conversation, follow what matters, and share what’s next on VAYXO.online.', icons:{icon:'/vayxo-logo.png',apple:'/vayxo-logo.png'},openGraph:{type:'website',siteName:'VAYXO.online',title:'VAYXO.online — what’s happening now',description:'Join the conversation, follow what matters, and share what’s next.',images:[{url:'/vayxo-logo.png',width:1024,height:1024,alt:'VAYXO.online'}]},twitter:{card:'summary',title:'VAYXO.online',description:'Join the conversation and share what’s next.',images:['/vayxo-logo.png']} };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{const t=localStorage.getItem('vayxo-theme')||'system';document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches))}catch{}`}}/></head><body><AuthProvider><AuthGate>{children}<AiDock/><CookieBanner/></AuthGate></AuthProvider></body></html>; }
