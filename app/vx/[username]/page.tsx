import{ProfileV2}from'@/components/ex/profile-v2';export default async function Page({params}:{params:Promise<{username:string}>}){return <ProfileV2 username={(await params).username}/>}
