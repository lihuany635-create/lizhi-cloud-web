// P1 offline UI candidate state: deliberately in-memory-only demo data.
// NOT a replacement for Google Auth, Supabase persistence, RLS or FSRS.
export const COURSE_STAGES = ['A0','A1','A2','B1','B2','C1','C2'];
export const EXERCISE_MODES = ['flip','choice','spelling','listening','sentence'];

export const demoCandidates = Object.freeze([
  { id:'cand-1', term:'hungry', meaning:'飢餓的', type:'adjective', example:'I am hungry.', status:'pending' },
  { id:'cand-2', term:'eaten', meaning:'eat 的過去分詞', type:'verb', example:'I have eaten.', status:'pending' },
  { id:'cand-3', term:'sleepy', meaning:'想睡的', type:'adjective', example:'I feel sleepy.', status:'pending' }
]);

export function normalizeTerm(value) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en') : '';
}
function audit(state, action, detail) {
  return [...state.audit, {seq:state.audit.length+1, action, detail}];
}
export function initialDemoState() {
  return {
    isDemo:true, stage:null, goal:5, theme:'light', tab:'home',
    candidates:demoCandidates.map(x=>({...x})),
    cards:[{id:'card-1',term:'rice',meaning:'米飯',type:'noun',example:'I eat rice.',status:'active'}],
    practice:[], audit:[],
  };
}
export function candidateDecision(state, candidateId, decision) {
  if (!['accept','ignore'].includes(decision)) return {state,code:'INVALID_DECISION'};
  const candidate=state.candidates.find(c=>c.id===candidateId);
  if (!candidate || candidate.status!=='pending') return {state,code:'CANDIDATE_NOT_PENDING'};
  const exists=state.cards.some(c=>normalizeTerm(c.term)===normalizeTerm(candidate.term));
  const candidates=state.candidates.map(c=>c.id===candidateId?{...c,status:decision==='accept'?(exists?'duplicate':'accepted'):'ignored'}:c);
  const cards=decision==='accept' && !exists
    ? [...state.cards,{id:'card-'+candidate.id,term:candidate.term,meaning:candidate.meaning,type:candidate.type,example:candidate.example,status:'active'}]
    : state.cards;
  return {state:{...state,candidates,cards,audit:audit(state,decision==='accept'?'approve_candidate':'ignore_candidate',candidateId)},code:decision==='accept' && exists?'DUPLICATE':decision==='accept'?'APPROVED':'IGNORED'};
}
export function addExplicitDemoCard(state,{term,meaning}) {
  const normalized=normalizeTerm(term);
  if (!normalized || normalized.length>120 || !String(meaning||'').trim() || String(meaning).length>250)
    return {state,code:'INVALID_CARD'};
  if (state.cards.some(c=>normalizeTerm(c.term)===normalized))
    return {state,code:'DUPLICATE'};
  const card={id:'manual-'+(state.cards.length+1),term:term.trim(),meaning:meaning.trim(),type:'custom',example:'',status:'active'};
  return {state:{...state,cards:[...state.cards,card],audit:audit(state,'add_demo_card',card.id)},code:'CREATED'};
}
export function recordDemoPractice(state,{cardId,mode,correct}) {
  if (!EXERCISE_MODES.includes(mode) || typeof correct!=='boolean' || !state.cards.some(c=>c.id===cardId))
    return {state,code:'INVALID_PRACTICE'};
  const event={cardId,mode,correct,number:state.practice.length+1};
  return {state:{...state,practice:[...state.practice,event],audit:audit(state,'demo_practice',cardId)},code:'RECORDED'};
}
export function getDemoSummary(state) {
  const pending=state.candidates.filter(x=>x.status==='pending').length;
  const done=state.practice.length;
  const correct=state.practice.filter(x=>x.correct).length;
  return {pending,cards:state.cards.length,done,accuracy:done?Math.round(correct/done*100):null};
}

// Pure selector keeps live search safe without re-rendering the focused input.
export function filterDemoCards(state, query) {
  const q = normalizeTerm(query);
  if (!q) return state.cards;
  return state.cards.filter(card =>
    normalizeTerm(card.term).includes(q) || String(card.meaning).includes(String(query).trim()));
}
