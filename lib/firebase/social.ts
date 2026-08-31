import { addDoc,collection,doc,increment,limit,orderBy,query,serverTimestamp,setDoc,updateDoc,where } from 'firebase/firestore';
import { db } from './client';
export async function createPost(uid:string,text:string,media:string[]=[]){if(!db)throw new Error('Firebase is not configured');return addDoc(collection(db,'posts'),{authorId:uid,text,media,createdAt:serverTimestamp(),replyCount:0,repostCount:0,likeCount:0,viewCount:0});}
export async function setFollow(uid:string,targetId:string,following:boolean){if(!db)throw new Error('Firebase is not configured');const ref=doc(db,'follows',`${uid}_${targetId}`);await setDoc(ref,{followerId:uid,followingId:targetId,active:following,updatedAt:serverTimestamp()},{merge:true});}
export async function setReaction(uid:string,postId:string,type:'like'|'bookmark'|'repost',active:boolean){if(!db)throw new Error('Firebase is not configured');await setDoc(doc(db,type+'s',`${uid}_${postId}`),{uid,postId,active,updatedAt:serverTimestamp()},{merge:true});}
export async function recordView(postId:string){if(!db)return;await updateDoc(doc(db,'posts',postId),{viewCount:increment(1)});}
export const timelineQuery=(followingIds:string[])=>db?query(collection(db,'posts'),...(followingIds.length?[where('authorId','in',followingIds.slice(0,30))]:[]),orderBy('createdAt','desc'),limit(20)):null;
