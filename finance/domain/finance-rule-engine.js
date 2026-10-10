(function(root,factory){
  const isNode=typeof module!=="undefined"&&module.exports;
  const api=factory(
    isNode?require("./finance-transaction-template.js"):root.FinanceTransactionTemplate,
    isNode?require("../parsers/finance-amount-parser.js"):root.FinanceAmountParser,
    isNode?require("../parsers/finance-date-parser.js"):root.FinanceDateParser,
    isNode?require("../rules/account-aliases.js"):root.FinanceAccountAliases,
    isNode?require("../rules/card-aliases.js"):root.FinanceCardAliases,
    isNode?require("../rules/merchant-rules.js"):root.FinanceMerchantRules,
    isNode?require("../rules/category-rules.js"):root.FinanceCategoryRules,
    isNode?require("../rules/transaction-keywords.js"):root.FinanceTransactionKeywords
  );
  if(isNode)module.exports=api;
  root.FinanceRuleEngine=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Template,AmountParser,DateParser,AccountAliases,CardAliases,MerchantRules,CategoryRules,TransactionKeywords){
  "use strict";

  const TRANSACTION_ANCHORS=Object.freeze(["早餐","午餐","中午","晚餐","晚上","宵夜","中油","加油","全聯","麥當勞","薪水","薪資","繳卡費","轉帳"]);
  const LOCK_ORDER=Object.freeze(["type","amount","merchant","category","account","creditCard","fromAccount","toAccount","dateToken","date"]);
  const PAYMENT_LANGUAGE=/(?:繳|付|支付|還|扣繳).{0,16}(?:卡費|信用卡|卡)|(?:卡費|信用卡).{0,12}(?:繳款|繳|付款|付|扣繳)/;
  const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
  const matchText=value=>String(value??"").normalize("NFKC").trim().toLocaleLowerCase("zh-TW");

  function normalizeText(value){
    if(typeof value!=="string")return "";
    return value.normalize("NFKC").replace(/[，、]/g,",").replace(/[。]/g,".").replace(/\s+/g," ").trim();
  }
  const contains=(text,value)=>{const key=matchText(value);return Boolean(key)&&text.includes(key);};
  const activeRows=rows=>(Array.isArray(rows)?rows:[]).filter(row=>row&&row.archived!==true&&row.active!==false&&typeof row.name==="string"&&row.name.trim());

  function resolveAlias(text,rows,groups,kind){
    const available=activeRows(rows),normalized=matchText(text);
    const exact=available.filter(row=>contains(normalized,row.name)).sort((a,b)=>b.name.length-a.name.length);
    const longest=exact.filter(row=>row.name.length===exact[0]?.name.length);
    if(longest.length===1)return Object.freeze({value:longest[0].name,source:`${kind}-alias:exact:${longest[0].name}`,issue:null});
    if(longest.length>1)return Object.freeze({value:null,source:null,issue:"ambiguous_alias"});
    const cardLanguage=/卡|信用卡|刷/.test(text),matches=[];
    for(const row of available){
      const rowName=matchText(row.name),rowAliases=Array.isArray(row.aliases)?row.aliases:[];
      for(const alias of rowAliases)if(contains(normalized,alias))matches.push({row,alias});
      for(const group of groups||[]){
        const aliases=(group.aliases||[]).filter(alias=>kind!=="account"||!cardLanguage||/帳戶|銀行|現金|cash/i.test(alias));
        const alias=aliases.find(value=>contains(normalized,value));
        if(!alias)continue;
        if((group.canonicalHints||[]).some(hint=>rowName.includes(matchText(hint))))matches.push({row,alias});
      }
    }
    const unique=[...new Map(matches.map(match=>[match.row.id||match.row.name,match])).values()];
    if(unique.length===1)return Object.freeze({value:unique[0].row.name,source:`${kind}-alias:${unique[0].alias}`,issue:null});
    if(unique.length>1)return Object.freeze({value:null,source:null,issue:"ambiguous_alias"});
    return Object.freeze({value:null,source:null,issue:null});
  }

  function resolveMerchant(text){
    const normalized=matchText(text),matches=MerchantRules.RULES.filter(rule=>rule.keywords.some(keyword=>contains(normalized,keyword)));
    const merchants=[...new Set(matches.map(rule=>rule.merchant))];
    if(merchants.length===1){const rule=matches.find(item=>item.merchant===merchants[0]),keyword=rule.keywords.find(value=>contains(normalized,value));return {value:merchants[0],source:`merchant:${keyword}`,issue:null};}
    return {value:null,source:null,issue:merchants.length>1?"ambiguous_merchant":null};
  }

  function resolveCategory(text,categories){
    const normalized=matchText(text),matches=CategoryRules.RULES.filter(rule=>rule.keywords.some(keyword=>contains(normalized,keyword))),names=[...new Set(matches.map(rule=>rule.category))];
    if(names.length!==1)return {value:null,source:null,issue:names.length>1?"ambiguous_category":null};
    const actual=activeRows(categories).filter(row=>matchText(row.name)===matchText(names[0]));
    if(actual.length!==1)return {value:null,source:null,issue:actual.length>1?"ambiguous_category":null};
    const rule=matches.find(item=>item.category===names[0]),keyword=rule.keywords.find(value=>contains(normalized,value));
    return {value:actual[0].name,source:`category:${keyword}`,issue:null};
  }

  function transactionHints(text){
    const normalized=matchText(text);
    if(PAYMENT_LANGUAGE.test(normalized))return Object.freeze(["credit_card_payment"]);
    if(/卡費/.test(normalized))return Object.freeze([]);
    for(const rule of TransactionKeywords.RULES)if(rule.keywords.some(keyword=>contains(normalized,keyword)))return Object.freeze([rule.type]);
    return Object.freeze([TransactionKeywords.DEFAULT_HINT]);
  }

  function explicitTransactionType(text){
    const normalized=matchText(text);
    if(PAYMENT_LANGUAGE.test(normalized))return "credit_card_payment";
    if(/刷卡|(?:信用卡|[^\s，,。]+卡)(?:消費|買)|(?:信用卡|[^\s，,。]+卡)刷|刷[^\s，,。]*卡/.test(normalized))return "credit_card_purchase";
    if(/轉帳|轉到|轉入|轉出|從.+轉.+到/.test(normalized))return "transfer";
    if(/薪水|薪資|收入|入帳/.test(normalized))return "income";
    return null;
  }

  function resolveTransferAccounts(text,accounts){
    const fromMatch=/(?:從)?(.+?)轉/.exec(text),toMatch=/(?:到|至)(.+)$/.exec(text);
    const from=fromMatch?resolveAlias(fromMatch[1],accounts,AccountAliases.GROUPS,"account"):null;
    const to=toMatch?resolveAlias(toMatch[1],accounts,AccountAliases.GROUPS,"account"):null;
    return {from,to};
  }

  function detectMultipleTransactions(text,candidates){
    if(candidates.length<2)return false;
    if(/然後|另外|還有|接著|再來/.test(text))return true;
    const anchors=TRANSACTION_ANCHORS.filter(anchor=>text.includes(anchor));
    return new Set(anchors).size>=2;
  }

  function emptyResult(normalizedText,issues){
    return Object.freeze({patch:Object.freeze({}),lockedFields:Object.freeze([]),sourceTrace:Object.freeze({}),issues:Object.freeze([...new Set(issues)]),multipleTransactions:false,typeHints:Object.freeze([]),normalizedText});
  }

  function parseFinanceRules(input,context={}){
    const normalizedText=normalizeText(input);
    if(!normalizedText)return emptyResult(normalizedText,["invalid_input"]);
    const amount=AmountParser.parseFinanceAmount(normalizedText);
    if(detectMultipleTransactions(normalizedText,amount.candidates)){
      return Object.freeze({patch:Object.freeze({}),lockedFields:Object.freeze([]),sourceTrace:Object.freeze({}),issues:Object.freeze(["multiple_transactions_not_supported"]),multipleTransactions:true,typeHints:Object.freeze([]),normalizedText});
    }

    const patch={},sourceTrace={},issues=[...amount.issues];
    if(amount.amount!==null){patch.amount=amount.amount;sourceTrace.amount=amount.source;}
    const date=DateParser.parseFinanceDate(normalizedText,context.currentDate);
    issues.push(...date.issues);
    if(date.dateToken){patch.dateToken=date.dateToken;patch.date=date.date;sourceTrace.dateToken=date.source;sourceTrace.date=date.source;}

    const typeHints=transactionHints(normalizedText),explicitType=explicitTransactionType(normalizedText),isTransfer=typeHints.includes("transfer"),isCardPayment=explicitType==="credit_card_payment";
    if(explicitType){patch.type=explicitType;sourceTrace.type=`type:explicit:${explicitType}`;}
    if(/卡費/.test(normalizedText)&&!explicitType)issues.push("payment_intent_unclear");
    const transfer=isTransfer?resolveTransferAccounts(normalizedText,context.accounts):{from:null,to:null};
    const account=isTransfer?Object.freeze({value:null,source:null,issue:null}):resolveAlias(normalizedText,context.accounts,AccountAliases.GROUPS,"account");
    const card=resolveAlias(normalizedText,context.creditCards,CardAliases.GROUPS,"card");
    if(account.issue)issues.push(account.issue);else if(account.value){const field=isCardPayment?"fromAccount":"account";patch[field]=account.value;sourceTrace[field]=account.source;}
    if(transfer.from?.issue)issues.push(transfer.from.issue);else if(transfer.from?.value){patch.fromAccount=transfer.from.value;sourceTrace.fromAccount=transfer.from.source;}
    if(transfer.to?.issue)issues.push(transfer.to.issue);else if(transfer.to?.value){patch.toAccount=transfer.to.value;sourceTrace.toAccount=transfer.to.source;}
    if(card.issue)issues.push(card.issue);else if(card.value){patch.creditCard=card.value;sourceTrace.creditCard=card.source;}
    if(!explicitType&&typeHints.includes("credit_card_purchase")&&card.value){patch.type="credit_card_purchase";sourceTrace.type="type:card-reference";}

    const merchant=resolveMerchant(normalizedText),category=resolveCategory(normalizedText,context.categories);
    if(merchant.issue)issues.push(merchant.issue);else if(merchant.value){patch.merchant=merchant.value;sourceTrace.merchant=merchant.source;}
    if(category.issue)issues.push(category.issue);else if(category.value){patch.category=category.value;sourceTrace.category=category.source;}

    const sanitized=Template.sanitizeFinanceTransactionTemplate(patch),safePatch={};
    for(const field of Template.FIELDS)if(field!=="version"&&own(patch,field)&&sanitized[field]!==null)safePatch[field]=sanitized[field];
    const lockedFields=LOCK_ORDER.filter(field=>own(safePatch,field));
    return Object.freeze({
      patch:Object.freeze(safePatch),lockedFields:Object.freeze(lockedFields),sourceTrace:Object.freeze({...sourceTrace}),
      issues:Object.freeze([...new Set(issues)]),multipleTransactions:false,typeHints,normalizedText
    });
  }

  function parseFinanceRulesToDraft(input,context={}){
    const rules=parseFinanceRules(input,context);
    const base=Template.mergeFinanceTransactionTemplate(Template.createFinanceTransactionTemplate(),{rawText:typeof input==="string"?input:null,source:"text"});
    const draft=Template.mergeFinanceTransactionTemplate(base,rules.patch);
    return Object.freeze({...rules,draft});
  }

  return Object.freeze({normalizeText,parseFinanceRules,parseFinanceRulesToDraft});
});
