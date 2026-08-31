'use client';
import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {motion} from 'framer-motion';
import {Brand} from './brand';
import {useAuth} from './auth-provider';

const publicPaths=['/login','/signup','/legal','/help'];
export function AuthGate({children}:{children:React.ReactNode}){
  const {user,loading}=useAuth(),path=usePathname(),router=useRouter();
  const isPublic=publicPaths.some(x=>path===x||path.startsWith(`${x}/`));
  useEffect(()=>{if(!loading&&!user&&!isPublic)router.replace(`/login?next=${encodeURIComponent(path)}`);if(!loading&&user&&!user.emailVerified&&path!=='/verify-email')router.replace('/verify-email');if(!loading&&user&&user.emailVerified&&(path==='/login'||path==='/signup'||path==='/verify-email'))router.replace('/home')},[loading,user,isPublic,path,router]);
  if(loading||(!user&&!isPublic)||(user&&!user.emailVerified&&path!=='/verify-email')||(user&&user.emailVerified&&(path==='/login'||path==='/signup'||path==='/verify-email')))return <div className="grid min-h-screen place-items-center"><motion.div initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} className="flex flex-col items-center gap-5"><Brand/><span className="vayxo-loader" aria-label="Loading"><i/><i/><i/></span></motion.div></div>;
  return children;
}
