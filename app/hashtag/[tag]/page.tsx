import{HashtagPage}from'@/components/ex/enhanced-explore';export default async function Page({params}:{params:Promise<{tag:string}>}){return <HashtagPage tag={(await params).tag}/>}
