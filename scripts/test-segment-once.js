/* Minimal single segment generation to sanity-check formatting */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ'

function parseArg(name, fallback = undefined) {
  const pref = `--${name}=`
  const arg = process.argv.find(a => a.startsWith(pref))
  return arg ? arg.slice(pref.length) : fallback
}

async function signIn(email, password){
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const token = data.session?.access_token
  if (!token) throw new Error('No access token received')
  return { token, supabase }
}

async function callFunction(token, name, body){
  const url = `${SUPABASE_URL}/functions/v1/${name}`
  const res = await fetch(url, {
    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify(body)
  })
  const txt = await res.text()
  let json
  try { json = JSON.parse(txt) } catch { json = { raw: txt } }
  return { status: res.status, json }
}

function countWords(t){ return (t||'').trim().split(/\s+/).filter(Boolean).length }

async function run(){
  const email = parseArg('email')
  const password = parseArg('password')
  const storyId = parseArg('story')
  if (!email || !password) throw new Error('Missing --email or --password')
  const { token, supabase } = await signIn(email, password)
  let sid = storyId
  if (!sid){
    const { data, error } = await supabase.from('stories').select('id').eq('age_group','4-6').eq('genre','Fantasy').order('created_at', { ascending: false }).limit(1)
    if (error) throw error
    sid = data?.[0]?.id
  }
  if (!sid) throw new Error('No story found')
  const { data: segs } = await supabase.from('story_segments').select('segment_number').eq('story_id', sid).order('segment_number', { ascending: false }).limit(1)
  const nextNo = (segs && segs[0]?.segment_number) ? segs[0].segment_number + 1 : 2
  const resp = await callFunction(token, 'generate-story-segment', { story_id: sid, segment_number: nextNo })
  const seg = resp.json?.data?.segment
  const content = seg?.content || ''
  console.log('status', resp.status, 'story', sid, 'segment', seg?.segment_number, 'words', countWords(content))
  console.log('content_sample', content.slice(0, 240).replace(/\s+/g,' '))
  console.log('choices', seg?.choices)
}

run().catch(e=>{ console.error(e); process.exit(1) })

