/**
 * Tale Forge - Send Migration Emails via Resend
 * 
 * This script calls the Supabase Edge Function that sends migration emails
 * to all users using your existing Resend integration.
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 * - Supabase Edge Function deployed: send-migration-email
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

const NEW_PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

// Set to true to test without sending emails
const DRY_RUN = false

// ============================================================================
// SCRIPT START
// ============================================================================

const supabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY)

async function sendMigrationEmails() {
  console.log('📧 Tale Forge - Send Migration Emails via Resend')
  console.log('================================================')
  console.log(`📊 Project: ${NEW_PROJECT_URL}`)
  console.log(`🔧 Dry Run: ${DRY_RUN ? 'YES (no emails will be sent)' : 'NO (will send emails)'}`)
  console.log('================================================\n')

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No emails will be sent\n')
  }

  try {
    console.log('🚀 Calling Supabase Edge Function: send-migration-email...\n')

    const { data, error } = await supabase.functions.invoke('send-migration-email', {
      body: { dryRun: DRY_RUN }
    })

    if (error) {
      console.error('❌ Error calling function:', error)
      return
    }

    console.log('\n')
    console.log('================================================')
    console.log('📊 RESULTS')
    console.log('================================================')
    console.log(`Total Users:           ${data.results.totalUsers}`)
    console.log(`Email/Password Users:  ${data.results.emailPasswordUsers}`)
    console.log(`Google Auth Users:     ${data.results.googleAuthUsers}`)
    console.log(`Emails Sent:           ${data.results.emailsSent} ✅`)
    console.log(`Emails Failed:         ${data.results.emailsFailed} ❌`)
    console.log('================================================')

    if (data.results.errors && data.results.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      data.results.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.email}: ${err.error}`)
      })
    }

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no emails were sent')
      console.log('Set DRY_RUN = false to send actual emails')
    } else {
      console.log('\n✅ Migration emails sent successfully!')
      console.log('\n📧 What users received:')
      console.log('─────────────────────────────────────')
      console.log(`✅ ${data.results.emailPasswordUsers} Email/Password users: Instructions to reset password`)
      console.log(`✅ ${data.results.googleAuthUsers} Google Auth users: Instructions to log in with Google`)
      console.log('\n💡 Users can now log in to https://tale-forge.app')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run script
sendMigrationEmails().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

