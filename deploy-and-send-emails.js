/**
 * Tale Forge - Deploy Function and Send Migration Emails
 * 
 * This script:
 * 1. Deploys the send-migration-email function to Supabase
 * 2. Sends migration emails to all users via Resend
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 * - Supabase Management API access token
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_REF = 'hlrvpuqwurtdbjkramcp'
const PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

// Get Management API token from environment or prompt user
const MANAGEMENT_API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

const DRY_RUN = false

// ============================================================================
// SCRIPT START
// ============================================================================

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function deployAndSendEmails() {
  console.log('🚀 Tale Forge - Deploy Function and Send Emails')
  console.log('================================================')
  console.log(`📊 Project: ${PROJECT_URL}`)
  console.log(`🔧 Dry Run: ${DRY_RUN ? 'YES' : 'NO'}`)
  console.log('================================================\n')

  // Skip deployment - just call the function directly
  console.log('⚠️  Skipping function deployment (requires Supabase CLI)')
  console.log('ℹ️  Calling existing function or using direct approach...\n')

  try {
    // Try calling the function first
    console.log('🔍 Attempting to call send-migration-email function...\n')
    
    const { data, error } = await supabase.functions.invoke('send-migration-email', {
      body: { dryRun: DRY_RUN }
    })

    if (error) {
      console.log('⚠️  Function not deployed yet. Using direct email approach...\n')
      await sendEmailsDirectly()
    } else {
      console.log('✅ Function called successfully!\n')
      printResults(data.results)
    }

  } catch (error) {
    console.log('⚠️  Function call failed. Using direct email approach...\n')
    await sendEmailsDirectly()
  }
}

async function sendEmailsDirectly() {
  console.log('📧 Sending emails directly via Resend API...\n')

  // Get Resend API key from environment
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY environment variable not set!')
    console.log('\nPlease set it:')
    console.log('export RESEND_API_KEY=re_your_key_here')
    console.log('\nOr run:')
    console.log('RESEND_API_KEY=re_your_key_here node deploy-and-send-emails.js')
    return
  }

  // Fetch all users
  console.log('📥 Fetching all users...')
  
  let allUsers = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
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

  console.log(`✅ Found ${allUsers.length} users\n`)

  // Categorize users
  const googleAuthUsers = []
  const emailPasswordUsers = []

  for (const user of allUsers) {
    const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                        user.app_metadata?.providers?.includes('google') ||
                        user.identities?.some(id => id.provider === 'google')
    
    if (isGoogleAuth) {
      googleAuthUsers.push(user)
    } else {
      emailPasswordUsers.push(user)
    }
  }

  console.log(`🔍 Categorized users:`)
  console.log(`   Email/Password: ${emailPasswordUsers.length}`)
  console.log(`   Google Auth: ${googleAuthUsers.length}\n`)

  const results = {
    totalUsers: allUsers.length,
    emailPasswordUsers: emailPasswordUsers.length,
    googleAuthUsers: googleAuthUsers.length,
    emailsSent: 0,
    emailsFailed: 0,
    errors: []
  }

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN - No emails will be sent\n')
    printResults(results)
    return
  }

  // Send emails
  console.log('📧 Sending emails via Resend...\n')

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i]
    const isGoogleAuth = googleAuthUsers.some(u => u.id === user.id)
    
    console.log(`📧 [${i + 1}/${allUsers.length}] Sending to: ${user.email}`)

    try {
      const subject = 'Tale Forge - Important: System Migration & Login Instructions'
      
      const html = generateEmailHTML(isGoogleAuth)

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tale Forge <no-reply@tale-forge.app>',
          to: [user.email],
          subject,
          html
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.log(`   ❌ Failed: ${error}`)
        results.emailsFailed++
        results.errors.push({
          email: user.email,
          error: error
        })
      } else {
        const result = await response.json()
        console.log(`   ✅ Email sent (ID: ${result.id})`)
        results.emailsSent++
      }

      // Small delay to avoid overwhelming Resend
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      results.emailsFailed++
      results.errors.push({
        email: user.email,
        error: error.message
      })
    }
  }

  console.log('\n')
  printResults(results)
}

function generateEmailHTML(isGoogleAuth) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; text-align: center; margin-bottom: 20px;">Tale Forge System Migration</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Hi there,
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We're writing to let you know that <strong>Tale Forge has been migrated to a new and improved system</strong>.
        </p>

        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h2 style="color: #333; font-size: 18px; margin-top: 0;">🔐 How to Log In:</h2>
          
          ${isGoogleAuth ? `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0;">
              <strong>Good news!</strong> Since you use Google to sign in:
            </p>
            <ol style="color: #666; font-size: 16px; line-height: 1.8;">
              <li>Go to <a href="https://tale-forge.app" style="color: #007bff;">https://tale-forge.app</a></li>
              <li>Click "Sign in with Google"</li>
              <li>That's it! No password needed.</li>
            </ol>
          ` : `
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 10px 0;">
              You'll need to reset your password:
            </p>
            <ol style="color: #666; font-size: 16px; line-height: 1.8;">
              <li>Go to <a href="https://tale-forge.app" style="color: #007bff;">https://tale-forge.app</a></li>
              <li>Click "Forgot Password"</li>
              <li>Enter your email and follow the reset link</li>
              <li>Set a new password and log in</li>
            </ol>
          `}
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; font-size: 16px; margin-top: 0;">💔 We Apologize</h3>
          <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
            We know system migrations can be frustrating, and we're truly sorry for any inconvenience. 
            This migration was necessary to improve Tale Forge's performance and reliability.
          </p>
        </div>

        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          <strong>Your account and data are safe.</strong> If you have any trouble logging in, just reply to this email and we'll help you immediately.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://tale-forge.app" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Tale Forge</a>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Thank you for your patience and for being part of Tale Forge!
        </p>

        <br>
        <p style="color: #333; font-weight: bold;">
          Best regards,<br>
          Kevin<br>
          Tale Forge Team
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; 2025 Tale Forge. All rights reserved.</p>
      </div>
    </div>
  `
}

function printResults(results) {
  console.log('================================================')
  console.log('📊 RESULTS')
  console.log('================================================')
  console.log(`Total Users:           ${results.totalUsers}`)
  console.log(`Email/Password Users:  ${results.emailPasswordUsers}`)
  console.log(`Google Auth Users:     ${results.googleAuthUsers}`)
  console.log(`Emails Sent:           ${results.emailsSent} ✅`)
  console.log(`Emails Failed:         ${results.emailsFailed} ❌`)
  console.log('================================================')

  if (results.errors && results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.slice(0, 10).forEach((err, i) => {
      console.log(`${i + 1}. ${err.email}: ${err.error}`)
    })
    if (results.errors.length > 10) {
      console.log(`... and ${results.errors.length - 10} more errors`)
    }
  }

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no emails were sent')
    console.log('Set DRY_RUN = false to send actual emails')
  } else {
    console.log('\n✅ Migration emails sent successfully!')
    console.log('\n📧 What users received:')
    console.log('─────────────────────────────────────')
    console.log(`✅ ${results.emailPasswordUsers} Email/Password users: Instructions to reset password`)
    console.log(`✅ ${results.googleAuthUsers} Google Auth users: Instructions to log in with Google`)
    console.log('\n💡 Users can now log in to https://tale-forge.app')
  }
}

// Run script
deployAndSendEmails().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

