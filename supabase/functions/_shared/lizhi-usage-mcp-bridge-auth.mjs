// Server-to-server bridge verification. A private Site must authenticate the
// ChatGPT principal itself BEFORE sending these headers to the Edge.
const pattern=/^[A-Za-z0-9._:@-]{8,200}$/;
const utf8=new TextEncoder();
const digest=async s=>new Uint8Array(await crypto.subtle.digest("SHA-256",utf8.encode(s)));
const matchHash=(a,b)=>{
 let x=0; for(let i=0;i<a.length;i++)x|=a[i]^b[i];
 return x===0;
};
export async function verifySiteBridge(headers,{secret,actor}={}){
 if(typeof secret!=="string"||secret.length<32 ||
    typeof actor!=="string"||!pattern.test(actor))return false;
 const supplied=headers?.get?.("x-lizhi-usage-bridge");
 const principal=headers?.get?.("x-lizhi-usage-actor");
 if(typeof supplied!=="string"||supplied.length<32||supplied.length>2048||
    typeof principal!=="string"||!pattern.test(principal))return false;
 // Digest before comparing to avoid early terminating byte-by-byte equality.
 const [a,b,c,d]=await Promise.all([
   digest(supplied),digest(secret),digest(principal),digest(actor)
 ]);
 return matchHash(a,b)&&matchHash(c,d);
}
