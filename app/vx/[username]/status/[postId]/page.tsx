import{PostDetailV2}from'@/components/ex/post-detail-v2';export default async function Page({params}:{params:Promise<{postId:string}>}){return <PostDetailV2 postId={(await params).postId}/>}
