const encoder = new TextEncoder();
function bytes(s: string) { return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); }
export function base64(b: ArrayBuffer | Uint8Array) { const raw=new Uint8Array(b);let binary='';for(let i=0;i<raw.length;i+=32768)binary+=String.fromCharCode(...raw.subarray(i,i+32768));return btoa(binary); }
export async function seal(value: string, secret: string, context: string) {
 const key=await crypto.subtle.importKey('raw',bytes(secret),'AES-GCM',false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(context)},key,encoder.encode(value));
 return base64(iv)+'.'+base64(encrypted);
}
export async function unseal(value:string, secret:string, context:string) {
 const [iv,data]=value.split('.'); const key=await crypto.subtle.importKey('raw',bytes(secret),'AES-GCM',false,['decrypt']);
 return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(iv),additionalData:encoder.encode(context)},key,bytes(data)));
}
export async function fingerprint(value:string, secret:string) {
 const key=await crypto.subtle.importKey('raw',bytes(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return base64(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
}
