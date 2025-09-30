/* Quick image generation latency probe.
 * Usage: node scripts/test-image-gen.js --email="..." --password="..."
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTMyMTIsImV4cCI6MjA3MzI2OTIxMn0._B9fXNzIgIvCUpH6_4Wkt3YZ5pbCffMadldBdeEBUFQ'

function parseArg(name, fallback = undefined) {
  const pref = `--${name}=`
  const arg = process.argv.find(a => a.startsWith(pref))
  return arg ? arg.slice(pref.length) : fallback
}

async function main(){
  const email = parseArg('email')
  const password = parseArg('password')
  if (!email || !password){
    console.error('Missing --email or --password')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Sign-in failed: ${error.message}`)
  const token = data.session?.access_token
  if (!token) throw new Error('No access token received')

  const body = {
    prompt: 'A friendly dragon and a brave knight in a moonlit forest, warm, adventurous, friendly, children\'s book illustration style',
    ageGroup: '7-9',
    genre: 'Fantasy'
  }

  const t0 = Date.now()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-story-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body)
  })
  const txt = await res.text()
  let json
  try { json = JSON.parse(txt) } catch { json = { raw: txt } }
  const dt = Date.now() - t0
  console.log('Status:', res.status)
  console.log('Duration(ms):', dt)
  console.log('Body:', JSON.stringify(json, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })

