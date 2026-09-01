import{FeaturePage}from'@/components/ex/feature-page';export default async function Page({params}:{params:Promise<{postId:string}>}){return <FeaturePage kind="post" postId={(await params).postId}/>}
