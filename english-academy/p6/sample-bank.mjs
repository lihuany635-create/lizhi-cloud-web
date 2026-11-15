// Synthetic P6 sample questions, not a certified CEFR or copyrighted exam bank.
// Actual diagnostic answer keys must stay server-side; the sample browser demo is educational only.
import { validateExercise } from './practice-engine.mjs';

const DATA=[
 {id:'ex-flip-rice',cardId:'word-rice',mode:'flip',prompt:'rice — 你記得意思嗎？',expected:'米飯',explanation:'Rice means 米飯'},
 {id:'ex-choice-be',cardId:'grammar-be',mode:'choice',prompt:'I ___ hungry.',expected:'am',
   choices:['is','are','am','were'],explanation:'With I, we use am.'},
 {id:'ex-spell-apple',cardId:'word-apple',mode:'spelling',prompt:'請拼出「蘋果」的英文。',expected:'apple'},
 {id:'ex-fill-perfect',cardId:'grammar-perfect',mode:'fill',prompt:"I ___ eaten any food.",expected:'haven’t',
   explanation:"Haven't + past participle; 'I haven't eaten any food.'"},
 {id:'ex-translate-food',cardId:'phrase-food',mode:'translation',prompt:'翻譯：我還沒有吃任何東西。',
   expected:"I haven't eaten anything.",
   acceptedAnswers:["I haven't eaten anything.","I have not eaten anything."],
   explanation:'The present perfect uses have not + past participle.'},
 {id:'ex-listening-hungry',cardId:'phrase-hungry',mode:'listening',
   prompt:'聆聽英語後輸入你聽到的句子。',expected:'I am hungry',audioText:'en:I am hungry',
   explanation:'I am hungry means 我餓了.'},
 {id:'ex-sentence-sleepy',cardId:'word-sleepy',mode:'sentence',
   prompt:"Please use 'sleepy' in one English sentence.",
   explanation:"Example: I feel sleepy after lunch."}
];
export const DEMO_PRACTICE_BANK=Object.freeze(DATA.map(validateExercise));
export function getDemoExercise(id){
 const found=DEMO_PRACTICE_BANK.find(x=>x.id===id);
 if(!found)throw new TypeError('UNKNOWN_EXERCISE');
 return found;
}
