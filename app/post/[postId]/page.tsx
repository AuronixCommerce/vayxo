import{PostDetailPage}from'@/components/ex/post-detail-page';export default async function Page({params}:{params:Promise<{postId:string}>}){return <PostDetailPage postId={(await params).postId}/>}
