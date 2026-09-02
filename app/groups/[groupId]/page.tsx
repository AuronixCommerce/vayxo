import{GroupChatPage}from'@/components/ex/group-chat-page';export default async function Page({params}:{params:Promise<{groupId:string}>}){return <GroupChatPage groupId={(await params).groupId}/>}
