import{onValue,ref,serverTimestamp,update}from'firebase/database';import{realtimeDb}from'./client';import type{SupportTicket}from'./realtime';
export type AdminSupportTicket=SupportTicket&{uid:string};
const needDb=()=>{if(!realtimeDb)throw new Error('VAYROX live data is not configured');return realtimeDb};
export function subscribeAllSupportTickets(cb:(items:AdminSupportTicket[])=>void){return onValue(ref(needDb(),'supportTickets'),snap=>{const rows:AdminSupportTicket[]=[];Object.entries(snap.val()||{}).forEach(([uid,tickets])=>Object.entries((tickets as Record<string,unknown>)||{}).forEach(([id,value])=>rows.push({uid,id,...value as Omit<SupportTicket,'id'>} as AdminSupportTicket)));rows.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));cb(rows)})}
export async function adminUpdateSupportTicket(uid:string,ticketId:string,status:SupportTicket['status']){await update(ref(needDb(),`supportTickets/${uid}/${ticketId}`),{status,updatedAt:serverTimestamp()})}
