/* One-time cleanup for embedded choices in segment content (current user only)
 * Usage: node scripts/run-cleanup.js --email="you@example.com" --password="secret" [--dry_run=false]
 */

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
  return { token }
}

async function callCleanup(token, dry_run){
  const url = `${SUPABASE_URL}/functions/v1/maintenance-clean-segments`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ dry_run }),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

async function run(){
  const email = parseArg('email')
  const password = parseArg('password')
  const dry_run = (parseArg('dry_run', 'true') !== 'false')
  if (!email || !password) {
    console.error('Missing --email or --password')
    process.exit(1)
  }
  console.log('Signing in ...')
  const { token } = await signIn(email, password)
  console.log('Signed in. Running cleanup...', dry_run ? '(dry-run)' : '(commit)')
  const { status, json } = await callCleanup(token, dry_run)
  console.log('Cleanup status:', status)
  console.log('Result:', JSON.stringify(json, null, 2))
  if (status >= 400) process.exit(1)
}

run().catch(err => {
  console.error('Cleanup failed:', err)
  process.exit(1)
})

