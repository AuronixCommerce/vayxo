import{redirect}from'next/navigation';export default async function Page({params}:{params:Promise<{username:string}>}){redirect(`/vx/${encodeURIComponent((await params).username)}/followers`)}
