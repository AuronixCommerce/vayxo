import{onDisconnect,onValue,push,ref,serverTimestamp,set,update}from'firebase/database';
import{realtimeDb}from'./client';
import type{ChatMessage}from'./realtime';
const needDb=()=>{if(!realtimeDb)throw new Error('VAYROX live data is not configured');return realtimeDb};
export async function sendChatMessage(conversationId:string,uid:string,text:string){const value=text.trim().slice(0,2000);if(!value)throw new Error('Message cannot be empty');const db=needDb(),node=push(ref(db,`messages/${conversationId}`));await set(node,{senderId:uid,text:value,createdAt:serverTimestamp(),seen:false});await update(ref(db,`conversations/${conversationId}`),{lastMessage:value,lastMessageAt:serverTimestamp(),lastSenderId:uid});return node.key}
export async function markConversationRead(uid:string,conversationId:string){await set(ref(needDb(),`conversationReadsByUser/${uid}/${conversationId}`),serverTimestamp())}
export function subscribeReadStates(uid:string,cb:(values:Record<string,number>)=>void){return onValue(ref(needDb(),`conversationReadsByUser/${uid}`),s=>cb((s.val()||{}) as Record<string,number>))}
export function subscribeConversationRead(uid:string,conversationId:string,cb:(value:number)=>void){return onValue(ref(needDb(),`conversationReadsByUser/${uid}/${conversationId}`),s=>cb(Number(s.val())||0))}
export async function setConversationTyping(conversationId:string,uid:string,active:boolean){const node=ref(needDb(),`typing/${conversationId}/${uid}`);if(active){await onDisconnect(node).remove();await set(node,serverTimestamp())}else await set(node,null)}
export function subscribeConversationTyping(conversationId:string,uid:string,cb:(typing:boolean)=>void){return onValue(ref(needDb(),`typing/${conversationId}`),s=>{const value=(s.val()||{}) as Record<string,number>;cb(Object.entries(value).some(([id,time])=>id!==uid&&Date.now()-Number(time)<8000))})}
export function messageSeenBy(readAt:number,message:ChatMessage){return Boolean(readAt&&message.createdAt&&readAt>=message.createdAt)}
