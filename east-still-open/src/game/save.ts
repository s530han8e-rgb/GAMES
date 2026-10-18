import {StateSchema,type State} from './engine';
const db=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('east-still-open',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
export async function load(){const d=await db();try{return await new Promise<State|undefined>((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get('current');r.onsuccess=()=>{if(!r.result){resolve(undefined);return}const s=StateSchema.safeParse(r.result);s.success?resolve(s.data):reject(new Error('存档损坏或版本不兼容，请建立新周目。'))};r.onerror=()=>reject(r.error)})}finally{d.close()}}
async function write(s:State){const d=await db();try{return await new Promise<void>((resolve,reject)=>{const tx=d.transaction('saves','readwrite');tx.objectStore('saves').put(s,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('存档写入中断'))})}finally{d.close()}}

let queue:Promise<void>=Promise.resolve();
export function save(s:State){queue=queue.catch(()=>{}).then(()=>write(s));return queue}
