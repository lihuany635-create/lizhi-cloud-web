// Open during the user's click; awaiting a signed URL first loses browser activation.
export async function openOriginalImage(access:()=>Promise<string>,open=()=>window.open('about:blank','_blank')){
 const tab=open();if(!tab)throw Error('瀏覽器阻擋了原圖視窗，請允許此網站開啟新視窗後再試。');
 tab.opener=null;
 try{tab.location.replace(await access());}catch(error){tab.close();throw error;}
}
