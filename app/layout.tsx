import type { Metadata } from 'next';
import './globals.css';
import { AiDock } from '@/components/ex/ai-dock';
import { AuthProvider } from '@/components/ex/auth-provider';
import { CookieBanner } from '@/components/ex/cookie-banner';
import { AuthGate } from '@/components/ex/auth-gate';
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||process.env.APP_URL||'https://vayrox.online';
export const metadata: Metadata = { metadataBase:new URL(siteUrl), applicationName:'VAYROX.online', title: { default: 'VAYROX.online — what’s happening now', template: '%s · VAYROX.online' }, description: 'Post what matters, follow people you care about, and join live conversations on VAYROX.online.', icons:{icon:'/vayxo-logo.png',apple:'/vayxo-logo.png'},openGraph:{type:'website',siteName:'VAYROX.online',title:'VAYROX.online — what’s happening now',description:'Post what matters, follow people you care about, and join live conversations.',images:[{url:'/vayxo-logo.png',width:1024,height:1024,alt:'VAYROX.online'}]},twitter:{card:'summary',title:'VAYROX.online',description:'Post, follow, reply, repost, and join the conversation.',images:['/vayxo-logo.png']} };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{const t=localStorage.getItem('vayrox-theme')||localStorage.getItem('vayxo-theme')||'system';document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches))}catch{}`}}/></head><body><AuthProvider><AuthGate>{children}<AiDock/><CookieBanner/></AuthGate></AuthProvider></body></html>; }
