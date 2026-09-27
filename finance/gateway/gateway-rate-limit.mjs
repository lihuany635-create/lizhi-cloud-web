export function createRateLimiter({limit=20,windowMs=60000,now=()=>Date.now()}={}){
  const buckets=new Map();
  return Object.freeze({
    take(key){const time=now(),recent=(buckets.get(key)||[]).filter(value=>value>time-windowMs);if(recent.length>=limit){buckets.set(key,recent);return false;}recent.push(time);buckets.set(key,recent);return true;}
  });
}
export function createConcurrencyLimiter({maximum=2}={}){
  let active=0;const requestIds=new Set();
  return Object.freeze({
    acquire(requestId){if(active>=maximum||requestIds.has(requestId))return null;active+=1;requestIds.add(requestId);let released=false;return()=>{if(released)return;released=true;active-=1;requestIds.delete(requestId);};},
    get active(){return active;}
  });
}

