import {integrationConfig} from './runtime-config.mjs?v=28';
import {createBridgeClient} from './bridge-client.mjs?v=28';
let bridge;
export const integrated=()=>!!integrationConfig.backendOrigin;
export function privateBridge(){return bridge??=createBridgeClient({backendOrigin:integrationConfig.backendOrigin})}
export const apiFetch=(path,options)=>integrated()?privateBridge().fetch(path,options):fetch(path,options);
