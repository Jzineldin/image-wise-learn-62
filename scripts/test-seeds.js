/* Quick story seeds latency probe.
 * Usage: node scripts/test-seeds.js --email="..." --password="..."
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

  const t0 = Date.now()
  const { data: resp, error: fnError } = await supabase.functions.invoke('generate-story-seeds', {
    body: { ageGroup: '7-9', genre: 'Fantasy', language: 'en' }
  })
  const dt = Date.now() - t0
  console.log('Status:', fnError ? 'error' : 'ok')
  console.log('Duration(ms):', dt)
  if (fnError) {
    console.log('Error:', fnError.message)
  } else {
    console.log('Seeds count:', (resp?.data?.seeds || resp?.seeds || []).length)
  }
}

main().catch(err => { console.error(err); process.exit(1) })

