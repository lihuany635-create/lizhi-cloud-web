(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.FinanceDateParser=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const pad=value=>String(value).padStart(2,"0");
  function isValidDateParts(year,month,day){
    if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1)return false;
    const days=[31,(year%4===0&&year%100!==0)||year%400===0?29:28,31,30,31,30,31,31,30,31,30,31];
    return day<=days[month-1];
  }
  function isoDate(year,month,day){return isValidDateParts(year,month,day)?`${year}-${pad(month)}-${pad(day)}`:null;}
  function localToday(){const date=new Date();return isoDate(date.getFullYear(),date.getMonth()+1,date.getDate());}
  function parseIso(value){const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||"");return match&&isoDate(Number(match[1]),Number(match[2]),Number(match[3]));}
  function shiftDate(value,days){const valid=parseIso(value);if(!valid)return null;const [year,month,day]=valid.split("-").map(Number),date=new Date(year,month-1,day);date.setDate(date.getDate()+days);return isoDate(date.getFullYear(),date.getMonth()+1,date.getDate());}
  function resolveDateToken(token,currentDate){const today=parseIso(currentDate)||localToday();if(token==="today")return today;if(token==="yesterday")return shiftDate(today,-1);if(token==="tomorrow")return shiftDate(today,1);return null;}

  function parseFinanceDate(input,currentDate){
    const text=typeof input==="string"?input:"",today=parseIso(currentDate)||localToday(),issues=[],signals=[];
    const ambiguous=/上週|下週|這週|本週|月底|月初|前幾天|幾天前|最近幾天|週末|星期|禮拜/;
    const unsupported=/大前天|後天|大後天|下個月|上個月|明年|去年|\d+\s*天(?:前|後)/;
    const dateSemantic=/(?:今天|昨天|前天|明天|後天|大前天|大後天|上週|下週|這週|本週|月底|月初|前幾天|幾天前|最近幾天|週末|星期|禮拜|下個月|上個月|明年|去年)|\d{1,4}\s*(?:年|月|日|號)/;
    if(ambiguous.test(text))issues.push("ambiguous_date");
    if(unsupported.test(text))issues.push("unrecognized_date");
    let match;
    const full=/(\d{4})\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{1,2})/.exec(text)||/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*(?:日|號)/.exec(text);
    if(full){const date=isoDate(Number(full[1]),Number(full[2]),Number(full[3]));if(date)signals.push({dateToken:"specific",date,source:"date:explicit-full"});else issues.push("invalid_date");}
    if(!full&&(match=/(?:^|[^\d])(\d{1,2})\s*[\/-]\s*(\d{1,2})(?!\d)/.exec(text))){
      const date=isoDate(Number(today.slice(0,4)),Number(match[1]),Number(match[2]));
      if(date)signals.push({dateToken:"specific",date,source:"date:explicit-month-day"});else issues.push("invalid_date");
    }
    if(!full&&!match&&(match=/(?:^|[^\d])(\d{1,2})\s*月\s*(\d{1,2})\s*(?:日|號)/.exec(text))){
      const date=isoDate(Number(today.slice(0,4)),Number(match[1]),Number(match[2]));
      if(date)signals.push({dateToken:"specific",date,source:"date:explicit-month-day-zh"});else issues.push("invalid_date");
    }
    if(text.includes("前天"))signals.push({dateToken:"specific",date:shiftDate(today,-2),source:"date:relative-前天"});
    if(text.includes("昨天"))signals.push({dateToken:"yesterday",date:shiftDate(today,-1),source:"date:yesterday"});
    if(text.includes("今天"))signals.push({dateToken:"today",date:today,source:"date:today"});
    if(text.includes("明天"))signals.push({dateToken:"specific",date:shiftDate(today,1),source:"date:relative-明天"});
    if(!signals.length&&!issues.length&&dateSemantic.test(text))issues.push("unrecognized_date");
    if(new Set(signals.map(signal=>signal.date)).size>1)issues.push("date_conflict");
    const uniqueIssues=Object.freeze([...new Set(issues)]);
    if(uniqueIssues.length)return Object.freeze({dateToken:null,date:null,source:null,issues:uniqueIssues});
    const signal=signals[0]||{dateToken:"today",date:today,source:"date:default-today"};
    return Object.freeze({...signal,issues:uniqueIssues});
  }

  return Object.freeze({parseFinanceDate,resolveDateToken,shiftDate,isValidDateParts});
});
