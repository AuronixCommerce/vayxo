import{HashtagV2}from'@/components/ex/explore-v2';export default async function Page({params}:{params:Promise<{tag:string}>}){return <HashtagV2 tag={(await params).tag}/>}
