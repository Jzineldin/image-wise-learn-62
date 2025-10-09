/**
 * Retry failed emails with slower rate (1 email per second)
 */

import { createClient } from '@supabase/supabase-js'

const PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'
const RESEND_API_KEY = process.env.RESEND_API_KEY

// Failed emails from previous run
const failedEmails = [
  'alaa.kheir@gmail.com',
  'benithaluhumbakahite2003@gmail.com',
  'wessozin@gmail.com',
  'marcusgladh@gmail.com',
  'krrcrypto@gmail.com',
  'kunal@autofintech.co.uk',
  'kevinkevinjosef@gmail.com',
  'hamzee.ali@hotmail.com',
  'michael@kollie.ai',
  'zainabchaudary54@gmail.com',
  'g.adam.whitney.storage@gmail.com',
  'lockedown.jl@gmail.com',
  'mmhmclane@gmail.com',
  'bglez88@gmail.com',
  'three.bishara@gmail.com',
  'student.two@deped.gov.ph',
  'tim@hi-ron.com',
  'laura.rijks@hotmail.com',
  'love@treasurylove.com',
  'jorjy@lovable.dev',
  'oeriksson@gmail.com',
  'viklund_12@hotmail.com',
  'kerstin@eiman.tv',
  'detoxnatta@gmail.com',
  'alexandra.rundqvist@hotmail.com',
  'henke.halvarsson@gmail.com',
  'vasicheva@yahoo.com',
  'jesper.ericson@gmail.com',
  'linda.bardh@gmail.com',
  'goransonhakan@gmail.com',
  'adam.sjoborg@gmail.com',
  'subhro.kb@gmail.com',
  'dstormdal@gmail.com',
  'nicoleviktoria@outlook.com',
  'taleforge96@gmail.com',
  'memetyerlikaya@gmail.com',
  'sapierkaitlyn@gmail.com',
  'mail@felixhaas.io',
  'aleksander@lovable.dev',
  'wefwef@gfmail.com',
  'mr.dimovski@gmail.com',
  'goguryo@hotmail.com',
  'pk34939@gmail.com',
  'trucmin15cn@gmail.com',
  'saraa.rashdan97@gmail.com',
  'postrilo@gmail.com',
  'jzineldin96@gmail.com',
  'betatest20250106@gmail.com',
  'sara.rashdan1@gmail.com',
  'jzineldin@gmail.com'
]

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY)

async function retryFailedEmails() {
  console.log('🔄 Retrying Failed Emails')
  console.log('================================================')
  console.log(`📧 Emails to retry: ${failedEmails.length}`)
  console.log(`⏱️  Rate: 1 email per second (slower to avoid rate limit)`)
  console.log('================================================\n')

  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not set!')
    return
  }

  // Fetch all users to get auth method
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = usersData.users

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  }

  for (let i = 0; i < failedEmails.length; i++) {
    const email = failedEmails[i]
    console.log(`📧 [${i + 1}/${failedEmails.length}] Sending to: ${email}`)

    try {
      // Find user to determine auth method
      const user = allUsers.find(u => u.email === email)
      if (!user) {
        console.log(`   ⚠️  User not found, skipping`)
        continue
      }

      const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                          user.app_metadata?.providers?.includes('google') ||
                          user.identities?.some(id => id.provider === 'google')

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
          to: [email],
          subject,
          html
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.log(`   ❌ Failed: ${error}`)
        results.failed++
        results.errors.push({ email, error })
      } else {
        const result = await response.json()
        console.log(`   ✅ Email sent (ID: ${result.id})`)
        results.sent++
      }

      // Wait 1 second between emails (slower rate)
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      results.failed++
      results.errors.push({ email, error: error.message })
    }
  }

  console.log('\n')
  console.log('================================================')
  console.log('📊 RETRY RESULTS')
  console.log('================================================')
  console.log(`Emails Sent:    ${results.sent} ✅`)
  console.log(`Emails Failed:  ${results.failed} ❌`)
  console.log('================================================')

  if (results.errors.length > 0) {
    console.log('\n❌ STILL FAILED:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.email}`)
    })
  }

  console.log('\n✅ Retry complete!')
  console.log(`\n📊 TOTAL PROGRESS:`)
  console.log(`   First run: 103 emails sent`)
  console.log(`   Retry run: ${results.sent} emails sent`)
  console.log(`   TOTAL: ${103 + results.sent} / 153 emails sent`)
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

retryFailedEmails().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

