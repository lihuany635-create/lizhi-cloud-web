import test from 'node:test';
import assert from 'node:assert/strict';
import { Rating } from 'ts-fsrs';
import {
  createEnglishScheduler, createReviewCard, reviewEnglishCard, dueCards,
  serializeCard, hydrateCard, ENGINE_VERSION
} from '../fsrs-engine.mjs';

const start = new Date('2026-11-15T00:00:00.000Z');
const requestId='review-test-000001';

test('the real FSRS-7 model is version-pinned and starts a new card',async()=>{
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'demo-rice',now:start});
  assert.equal(ENGINE_VERSION.libraryVersion,'6.0.0');
  assert.equal(ENGINE_VERSION.modelVersion,'FSRS-7');
  assert.equal(card.cardId,'demo-rice');
  assert.ok(card.dueAt instanceof Date);
  assert.equal(card.state,0);
});

test('Again/Hard/Good/Easy produce four valid and independently computed outcomes',async()=>{
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'demo-hungry',now:start});
  const grades=[Rating.Again,Rating.Hard,Rating.Good,Rating.Easy];
  const due=[];
  for(const [i,rating] of grades.entries()){
    const now=new Date('2026-11-15T01:00:00.000Z');
    const result=reviewEnglishCard({scheduler,card,rating,now,
      requestId:'grade-case-00000'+i});
    assert.equal(result.card.cardId,'demo-hungry');
    assert.equal(result.history.length,1);
    assert.equal(result.history[0].model,'FSRS-7');
    assert.ok(new Date(result.nextDueAt).getTime()>now.getTime());
    assert.equal(result.replay,false);
    due.push(result.card.dueAt.getTime());
  }
  assert.equal(card.state,0,'review must not overwrite original card');
  assert.ok(new Set(due).size>=2,'different ratings should not all schedule identically');
});

test('same timestamp and rating are deterministic across independent schedulers',async()=>{
  const a=await createEnglishScheduler();
  const b=await createEnglishScheduler();
  const one=reviewEnglishCard({scheduler:a,
    card:createReviewCard(a,{cardId:'stable-review',now:start}),
    rating:Rating.Good,now:start,requestId,
  });
  const two=reviewEnglishCard({scheduler:b,
    card:createReviewCard(b,{cardId:'stable-review',now:start}),
    rating:Rating.Good,now:start,requestId,
  });
  assert.equal(one.nextDueAt,two.nextDueAt);
  assert.equal(one.card.stability,two.card.stability);
});

test('repeat request id appends no additional history events',async()=>{
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'demo-card',now:start});
  const first=reviewEnglishCard({scheduler,card,rating:Rating.Good,now:start,requestId});
  const retry=reviewEnglishCard({scheduler,card:first.card,rating:Rating.Good,
    now:start,requestId,history:first.history});
  assert.equal(retry.replay,true);
  assert.equal(retry.history.length,1);
  assert.equal(retry.card.reps,first.card.reps);
});

test('reused request id with conflicting rating is rejected',async()=>{
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'demo-card',now:start});
  const first=reviewEnglishCard({scheduler,card,rating:Rating.Good,now:start,requestId});
  assert.throws(()=>reviewEnglishCard({scheduler,card:first.card,rating:Rating.Again,
    now:start,requestId,history:first.history}),/IDEMPOTENCY_CONFLICT/);
});

test('review history remains append-only and original input is unchanged',async()=>{
  const scheduler=await createEnglishScheduler();
  const original=createReviewCard(scheduler,{cardId:'demo-card',now:start});
  const first=reviewEnglishCard({scheduler,card:original,rating:Rating.Good,
    now:start,requestId});
  const later=new Date('2026-11-20T00:00:00.000Z');
  const next=reviewEnglishCard({scheduler,card:first.card,rating:Rating.Hard,
    now:later,requestId:'review-test-000002',history:first.history});
  assert.equal(first.history.length,1);
  assert.equal(next.history.length,2);
  assert.notEqual(next.history,first.history);
  assert.equal(original.state,0);
});

test('invalid retention, time and review ratings fail closed',async()=>{
  await assert.rejects(()=>createEnglishScheduler({desiredRetention:1.5}),/RETENTION_OUT_OF_RANGE/);
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'demo-card',now:start});
  assert.throws(()=>reviewEnglishCard({scheduler,card,now:start,
    rating:99,requestId}),/INVALID_RATING/);
  assert.throws(()=>reviewEnglishCard({scheduler,card,now:new Date(NaN),
    rating:Rating.Good,requestId}),/INVALID_DATE/);
  assert.throws(()=>reviewEnglishCard({scheduler,card,now:start,
    rating:Rating.Good,requestId:'short'}),/INVALID_REQUEST_ID/);
});

test('due queue handles times and excludes suspended cards',async()=>{
  const scheduler=await createEnglishScheduler();
  const card=createReviewCard(scheduler,{cardId:'a',now:start});
  const future=createReviewCard(scheduler,{cardId:'b',now:new Date(start.getTime()+86_400_000)});
  const result=dueCards([future,card],start);
  assert.deepEqual(result.map(x=>x.cardId),['a']);
});

test('serialize and hydrate preserve ISO dates and card state for persistence contract',async()=>{
  const scheduler=await createEnglishScheduler();
  const a=createReviewCard(scheduler,{cardId:'persisted-card',now:start});
  const reviewed=reviewEnglishCard({scheduler,card:a,rating:Rating.Good,now:start,requestId});
  const saved=serializeCard(reviewed.card);
  assert.equal(typeof saved.dueAt,'string');
  const loaded=hydrateCard(JSON.parse(JSON.stringify(saved)));
  assert.equal(loaded.dueAt.toISOString(),reviewed.nextDueAt);
  assert.equal(loaded.reps,reviewed.card.reps);
  assert.deepEqual(dueCards([loaded],new Date(loaded.dueAt.getTime()+1)).map(x=>x.cardId),
    ['persisted-card']);
});
