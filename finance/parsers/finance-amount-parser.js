(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceAmountParser=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DIGITS=Object.freeze({零:0,"〇":0,一:1,二:2,兩:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9});
  const SMALL_UNITS=Object.freeze({十:10,百:100,千:1000});
  const AMOUNT_UNITS="元塊块圓圆";
  const QUANTITY_MEASURE_WORDS=Object.freeze(["筆","份","次","張","個","杯","餐","件","台","組","包","瓶"]);
  const CHINESE_NUMBER_CHARS="零〇一二兩两三四五六七八九十百千萬万";
  const AMBIGUOUS_PATTERNS=Object.freeze([/[零〇一二兩两三四五六七八九十百千萬万]+多(?:元|塊|块|圓|圆)?/,/快\s*[零〇一二兩两三四五六七八九十百千萬万\d,]+/,/[零〇一二兩两三四五六七八九]\s*[、到至~-]\s*[零〇一二兩两三四五六七八九十百千萬万]+/]);

  function parseChineseStandard(value){
    let total=0,section=0,number=0;
    for(const char of value){
      if(Object.prototype.hasOwnProperty.call(DIGITS,char)){number=DIGITS[char];continue;}
      if(char==="萬"||char==="万"){
        section+=number;
        total+=(section||1)*10000;
        section=0;number=0;continue;
      }
      const unit=SMALL_UNITS[char];
      if(unit){section+=(number||1)*unit;number=0;}
    }
    return total+section+number;
  }

  function parseChineseAmount(value){
    if(typeof value!=="string"||!value)return null;
    const normalized=value.replace(/两/g,"兩").replace(/万/g,"萬");
    if(!/^[零〇一二兩三四五六七八九十百千萬]+$/.test(normalized))return null;
    let result=parseChineseStandard(normalized);
    const colloquial=/^(.*)([百千萬])([一二兩三四五六七八九])$/.exec(normalized);
    if(colloquial){
      const unit={百:100,千:1000,萬:10000}[colloquial[2]],tail=DIGITS[colloquial[3]];
      result=result-tail+tail*(unit/10);
    }
    return Number.isSafeInteger(result)&&result>0?result:null;
  }

  function excludedRanges(text){
    const quantityWords=QUANTITY_MEASURE_WORDS.join("|");
    const ranges=[],patterns=[
      /\d{4}\s*[\/-]\s*\d{1,2}\s*[\/-]\s*\d{1,2}/g,
      /\b\d{1,2}\s*[\/-]\s*\d{1,2}\b/g,
      /(?:\d{4}\s*年\s*)?\d{1,2}\s*月\s*\d{1,2}\s*(?:日|號)/g,
      new RegExp(`[${CHINESE_NUMBER_CHARS}]+\\s*(?:${quantityWords})`,"g"),
      /(?:末四碼|尾碼|末碼)\s*\d{3,6}/g
    ];
    for(const pattern of patterns){let match;while((match=pattern.exec(text)))ranges.push([match.index,match.index+match[0].length]);}
    return ranges;
  }
  const overlaps=(start,end,ranges)=>ranges.some(([from,to])=>start<to&&end>from);

  function parseFinanceAmount(input){
    const text=typeof input==="string"?input:"",issues=[],candidates=[],ranges=excludedRanges(text);
    if(AMBIGUOUS_PATTERNS.some(pattern=>pattern.test(text)))issues.push("ambiguous_amount");
    const arabic=/(?:(?:NT\$|NTD|TWD|\$)\s*)?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\s*[元塊块圓圆])?/gi;
    let match;
    while((match=arabic.exec(text))){
      if(overlaps(match.index,match.index+match[0].length,ranges))continue;
      const numeric=match[0].replace(new RegExp(`[\\s,${AMOUNT_UNITS}]`,"g"),"").replace(/^(?:NT\$|NTD|TWD|\$)/i,"");
      const value=Number(numeric);
      if(!Number.isFinite(value)||value<=0)continue;
      candidates.push(Object.freeze({value,raw:match[0],start:match.index,end:match.index+match[0].length,source:"amount:arabic-number"}));
    }
    const chinese=/[零〇一二兩两三四五六七八九十百千萬万]+(?:\s*[元塊块圓圆])?/g;
    while((match=chinese.exec(text))){
      if(overlaps(match.index,match.index+match[0].length,ranges))continue;
      const raw=match[0],value=parseChineseAmount(raw.replace(new RegExp(`[\\s${AMOUNT_UNITS}]`,"g"),""));
      if(value!==null)candidates.push(Object.freeze({value,raw,start:match.index,end:match.index+raw.length,source:"amount:chinese-number"}));
    }
    candidates.sort((a,b)=>a.start-b.start||a.end-b.end);
    if(candidates.some(candidate=>!Number.isSafeInteger(candidate.value)))issues.push("unsupported_decimal_amount");
    if(candidates.length>1)issues.push("amount_conflict");
    const uniqueIssues=Object.freeze([...new Set(issues)]),valid=candidates.length===1&&uniqueIssues.length===0;
    return Object.freeze({amount:valid?candidates[0].value:null,source:valid?candidates[0].source:null,candidates:Object.freeze(candidates),issues:uniqueIssues});
  }

  return Object.freeze({QUANTITY_MEASURE_WORDS,parseChineseAmount,parseFinanceAmount});
});
