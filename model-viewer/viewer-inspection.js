(function(root){
'use strict';
// Viewer-only inspection policy. GLB geometry and original light values stay intact.
function keepMesh(bounds,cutHeight){return !Number.isFinite(cutHeight)||bounds.min[1]<=cutHeight+0.002;}
function lightVisible(originalVisible,inspection){return !!originalVisible&&!inspection;}
function checkHash(expected,actual){return !expected||expected===actual;}
root.GLBInspection={version:'20261022-2',keepMesh,lightVisible,checkHash};
})(typeof window==='undefined'?globalThis:window);
