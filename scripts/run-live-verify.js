/* Live verification script for Tale-Forge functions
 * Usage: node scripts/run-live-verify.js --email="you@example.com" --password="secret"
 */

import { createClient } from '@supabase/supabase-js'
// Node 18+ has global fetch

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ'

function parseArg(name, fallback = undefined) {
  const pref = `--${name}=`
  const arg = process.argv.find(a => a.startsWith(pref))
  return arg ? arg.slice(pref.length) : fallback
}

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)) }

function countWords(text){
  return (text || '').trim().split(/\s+/).filter(Boolean).length
}

async function signIn(email, password){
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const token = data.session?.access_token
  if (!token) throw new Error('No access token received')
  return { token, supabase }
}

async function findExistingStory(supabase, { ageGroup, genre }){
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, age_group, genre, language_code')
    .eq('age_group', ageGroup)
    .eq('genre', genre)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw new Error(`Find story failed: ${error.message}`)
  return data && data[0]
}

async function createStory(supabase, { title, genre, ageGroup, languageCode }){
  // Some RLS policies may block inserts via client tokens. Try select first.
  const existing = await findExistingStory(supabase, { ageGroup, genre })
  if (existing) return existing
  const insert = { title, genre, age_group: ageGroup, language_code: languageCode, status: 'in_progress' }
  const { data, error } = await supabase.from('stories').insert(insert).select('id, title, genre, age_group, language_code').single()
  if (error) throw new Error(`Create story failed: ${error.message}`)
  return data
}

async function callFunction(token, name, body){
  const url = `${SUPABASE_URL}/functions/v1/${name}`
  const t0 = Date.now()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  let json
  try { json = JSON.parse(txt) } catch { json = { raw: txt } }
  const dt = Date.now() - t0
  return { status: res.status, json, durationMs: dt }
}

async function getNextSegmentNumber(supabase, storyId){
  const { data, error } = await supabase
    .from('story_segments')
    .select('segment_number')
    .eq('story_id', storyId)
    .order('segment_number', { ascending: false })
    .limit(1)
  if (error) throw new Error(`Fetch segments failed: ${error.message}`)
  const last = data && data[0]?.segment_number
  return (last ? last + 1 : 1)
}

async function run(){
  const email = parseArg('email')
  const password = parseArg('password')
  if (!email || !password) {
    console.error('Missing --email or --password')
    process.exit(1)
  }

  console.log('Signing in ...')
  const { token, supabase } = await signIn(email, password)
  console.log('Signed in. Token acquired.')

  const tests = []

  // 1) One opening per age group (Fantasy)
  const ages = ['4-6','7-9','10-12','13+']
  for (const age of ages){
    let story
    try {
      story = await createStory(supabase, { title: `LV ${age} Fantasy`, genre: 'Fantasy', ageGroup: age, languageCode: 'en' })
    } catch (e) {
      console.warn(`Skipping opening for age ${age}: ${e.message}`)
      continue
    }
    const open = await callFunction(token, 'generate-story', {
      storyId: story.id,
      prompt: 'A friendly tale about animal friends learning something new.',
      genre: 'Fantasy',
      ageGroup: age,
      languageCode: 'en',
      isInitialGeneration: true,
    })
    const content = open.json?.data?.content || ''
    tests.push({ kind: 'opening', age, genre: 'Fantasy', storyId: story.id, status: open.status, durationMs: open.durationMs, words: countWords(content), sample: content.slice(0, 220), body: open.json })
    await sleep(500)
  }

  // 2) Genre influence: 7-9 in Adventure and Mystery
  for (const genre of ['Adventure', 'Mystery']){
    let story
    try {
      story = await createStory(supabase, { title: `LV 7-9 ${genre}`, genre, ageGroup: '7-9', languageCode: 'en' })
    } catch (e) {
      console.warn(`Skipping 7-9 ${genre} opening: ${e.message}`)
      continue
    }
    const open = await callFunction(token, 'generate-story', {
      storyId: story.id,
      prompt: `An exciting ${genre.toLowerCase()} suitable for young readers.`,
      genre,
      ageGroup: '7-9',
      languageCode: 'en',
      isInitialGeneration: true,
    })
    const content = open.json?.data?.content || ''
    tests.push({ kind: 'opening', age: '7-9', genre, storyId: story.id, status: open.status, durationMs: open.durationMs, words: countWords(content), sample: content.slice(0, 220), body: open.json })
    await sleep(500)
  }

  // 3) Continuation + Ending on one of the above (fallback to first available story)
  const target = tests.find(t => t.kind==='opening')
  if (target){
    const nextNo = await getNextSegmentNumber(supabase, target.storyId)
    const seg = await callFunction(token, 'generate-story-segment', {
      story_id: target.storyId,
      segment_number: nextNo,
    })
    const segContent = seg.json?.data?.segment?.content || ''
    tests.push({ kind: 'segment', age: target.age, genre: target.genre, storyId: target.storyId, status: seg.status, durationMs: seg.durationMs, words: countWords(segContent), sample: segContent.slice(0, 220), body: seg.json })
    await sleep(500)

    const end = await callFunction(token, 'generate-story-ending', {
      story_id: target.storyId,
      ending_type: 'lesson',
    })
    const endContent = end.json?.data?.content || end.json?.content || ''
    tests.push({ kind: 'ending', age: target.age, genre: target.genre, storyId: target.storyId, status: end.status, durationMs: end.durationMs, words: countWords(endContent), sample: endContent.slice(0, 220), body: end.json })
  }

  // 4) Error handling: call segment missing story_id
  const err = await callFunction(token, 'generate-story-segment', { segment_number: 3 })
  tests.push({ kind: 'error-segment', status: err.status, json: err.json })

  // Print summary
  console.log('\n===== Live Verify Summary =====')
  for (const t of tests){
    if (t.kind === 'error-segment'){
      console.log(`[${t.kind}] status=${t.status} body=`, t.json)
    } else {
      const creditsRemaining = t.body?.data?.credits_remaining ?? t.body?.credits_remaining
      console.log(`[${t.kind}] age=${t.age} genre=${t.genre} status=${t.status} words=${t.words} time=${t.durationMs}ms story=${t.storyId}${creditsRemaining!==undefined?` credits_left=${creditsRemaining}`:''}`)
      console.log(`  sample: ${t.sample.replace(/\s+/g,' ').trim()}`)
      if (t.status >= 400) console.log('  body:', t.body)
    }
  }
}

run().catch(err => {
  console.error('Live verify failed:', err)
  process.exit(1)
})

