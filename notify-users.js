/**
 * Tale Forge - User Notification Script
 * 
 * Sends appropriate notifications to users based on their auth method:
 * - Email/Password users: Send password reset email
 * - Google Auth users: Send info email (they can just log in with Google)
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

// New project (destination) - hlrvpuqwurtdbjkramcp
const NEW_PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

// Options
const DRY_RUN = false // Set to true to see what would happen without sending emails
const SEND_PASSWORD_RESETS = true // Send password reset to email/password users
const SHOW_GOOGLE_USERS = true // Show list of Google Auth users (they don't need password reset)

// ============================================================================
// SCRIPT START
// ============================================================================

const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY)

// Track results
const results = {
  totalUsers: 0,
  emailPasswordUsers: 0,
  googleAuthUsers: 0,
  passwordResetsSent: 0,
  passwordResetsFailed: 0,
  errors: []
}

const googleAuthUsers = []
const emailPasswordUsers = []

/**
 * Main function
 */
async function notifyUsers() {
  console.log('📧 Tale Forge - User Notification Script')
  console.log('=========================================')
  console.log(`📊 Project: ${NEW_PROJECT_URL}`)
  console.log(`🔧 Dry Run: ${DRY_RUN ? 'YES (no emails will be sent)' : 'NO (will send emails)'}`)
  console.log('=========================================\n')

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No emails will be sent\n')
  }

  try {
    // Step 1: Fetch all users with pagination
    console.log('📥 Step 1: Fetching all users...')
    
    let allUsers = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const { data, error } = await newSupabase.auth.admin.listUsers({
        page: page,
        perPage: 1000
      })
      
      if (error) {
        console.error('❌ Error fetching users:', error)
        return
      }
      
      if (data && data.users && data.users.length > 0) {
        allUsers = allUsers.concat(data.users)
        console.log(`   Fetched page ${page}: ${data.users.length} users (total: ${allUsers.length})`)
        
        if (data.users.length < 1000) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }
    
    results.totalUsers = allUsers.length
    console.log(`✅ Found ${results.totalUsers} users\n`)

    // Step 2: Categorize users by auth method
    console.log('🔍 Step 2: Categorizing users by auth method...')
    
    for (const user of allUsers) {
      // Check if user signed up with Google
      const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                          user.app_metadata?.providers?.includes('google') ||
                          user.identities?.some(id => id.provider === 'google')
      
      if (isGoogleAuth) {
        googleAuthUsers.push(user)
        results.googleAuthUsers++
      } else {
        emailPasswordUsers.push(user)
        results.emailPasswordUsers++
      }
    }
    
    console.log(`✅ Email/Password users: ${results.emailPasswordUsers}`)
    console.log(`✅ Google Auth users: ${results.googleAuthUsers}\n`)

    // Step 3: Send password resets to email/password users
    if (SEND_PASSWORD_RESETS && emailPasswordUsers.length > 0) {
      console.log('📧 Step 3: Sending password reset emails to Email/Password users...\n')
      
      for (let i = 0; i < emailPasswordUsers.length; i++) {
        const user = emailPasswordUsers[i]
        console.log(`📧 [${i + 1}/${emailPasswordUsers.length}] Sending to: ${user.email}`)
        
        if (DRY_RUN) {
          console.log('   ⏭️  Skipped (dry run)\n')
        } else {
          const { error } = await newSupabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: 'https://tale-forge.app/reset-password'
          })
          
          if (error) {
            console.log(`   ❌ Failed: ${error.message}\n`)
            results.passwordResetsFailed++
            results.errors.push({
              user: user.email,
              error: error.message
            })
          } else {
            console.log('   ✅ Password reset email sent\n')
            results.passwordResetsSent++
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    // Step 4: Show Google Auth users (they don't need password reset)
    if (SHOW_GOOGLE_USERS && googleAuthUsers.length > 0) {
      console.log('\n👥 Google Auth Users (No password reset needed):')
      console.log('================================================')
      console.log('These users can log in directly with "Sign in with Google"\n')
      
      googleAuthUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`)
      })
      console.log('')
    }

    // Step 5: Print summary
    printSummary()

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n')
  console.log('=========================================')
  console.log('📊 NOTIFICATION SUMMARY')
  console.log('=========================================')
  console.log(`Total Users:                ${results.totalUsers}`)
  console.log(`Email/Password Users:       ${results.emailPasswordUsers}`)
  console.log(`Google Auth Users:          ${results.googleAuthUsers}`)
  console.log(`Password Resets Sent:       ${results.passwordResetsSent} ✅`)
  console.log(`Password Resets Failed:     ${results.passwordResetsFailed} ❌`)
  console.log('=========================================')
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.user}: ${err.error}`)
    })
  }
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no emails were sent')
    console.log('Set DRY_RUN = false to send actual emails')
  } else {
    console.log('\n✅ Notification complete!')
    console.log('\n📧 What users will receive:')
    console.log('─────────────────────────────────────')
    console.log(`✅ ${results.passwordResetsSent} Email/Password users: Password reset email`)
    console.log(`ℹ️  ${results.googleAuthUsers} Google Auth users: Can log in with Google (no email needed)`)
  }
  
  console.log('\n💡 NEXT STEPS:')
  console.log('─────────────────────────────────────')
  console.log('1. Email/Password users will receive a password reset email')
  console.log('2. They click the link and set a new password')
  console.log('3. They can then log in to https://tale-forge.app')
  console.log('')
  console.log('4. Google Auth users can log in directly with "Sign in with Google"')
  console.log('5. No action needed from them!')
  console.log('')
  console.log('6. Consider sending a manual email to ALL users explaining:')
  console.log('   - Tale Forge has been migrated to a new system')
  console.log('   - Email/Password users: Check email for password reset')
  console.log('   - Google Auth users: Just log in with Google as usual')
  console.log('   - Apologize for any inconvenience')
}

// Run script
notifyUsers().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

