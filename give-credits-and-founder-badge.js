/**
 * Tale Forge - Give Credits and Founder Badge to Migrated Users
 * 
 * This script:
 * 1. Fetches all users
 * 2. Checks their current credits
 * 3. If credits < 100, sets credits to 100
 * 4. Adds "founder" badge to all migrated users
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

const DRY_RUN = false // Set to true to test without making changes
const MIN_CREDITS = 100 // Minimum credits to ensure

// ============================================================================
// SCRIPT START
// ============================================================================

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const results = {
  totalUsers: 0,
  creditsUpdated: 0,
  creditsSkipped: 0,
  badgesAdded: 0,
  badgesSkipped: 0,
  errors: []
}

async function giveCreditsAndBadges() {
  console.log('🎁 Tale Forge - Give Credits and Founder Badge')
  console.log('================================================')
  console.log(`📊 Project: ${PROJECT_URL}`)
  console.log(`💰 Minimum Credits: ${MIN_CREDITS}`)
  console.log(`🏆 Badge: Founder`)
  console.log(`🔧 Dry Run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO (will update database)'}`)
  console.log('================================================\n')

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n')
  }

  try {
    // Step 1: Fetch all users
    console.log('📥 Step 1: Fetching all users...')
    
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

    results.totalUsers = allUsers.length
    console.log(`✅ Found ${results.totalUsers} users\n`)

    // Step 2: Fetch all profiles
    console.log('📥 Step 2: Fetching all profiles...')

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, credits, founder_status')

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`✅ Found ${profiles.length} profiles\n`)

    // Create a map of user_id -> profile
    const profileMap = new Map()
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile)
    })

    // Step 3: Update credits and badges
    console.log('💰 Step 3: Updating credits and badges...\n')

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i]
      const profile = profileMap.get(user.id)
      
      console.log(`👤 [${i + 1}/${allUsers.length}] Processing: ${user.email}`)

      if (!profile) {
        console.log('   ⚠️  No profile found, skipping\n')
        continue
      }

      const currentCredits = profile.credits || 0
      const currentFounderStatus = profile.founder_status

      let needsUpdate = false
      let updates = {}

      // Check if credits need updating
      if (currentCredits < MIN_CREDITS) {
        updates.credits = MIN_CREDITS
        needsUpdate = true
        console.log(`   💰 Credits: ${currentCredits} → ${MIN_CREDITS}`)
      } else {
        console.log(`   ✅ Credits: ${currentCredits} (already above ${MIN_CREDITS})`)
        results.creditsSkipped++
      }

      // Check if founder status needs adding
      if (!currentFounderStatus || currentFounderStatus !== 'founder') {
        updates.founder_status = 'founder'
        needsUpdate = true
        console.log(`   🏆 Founder Status: ${currentFounderStatus || 'none'} → founder`)
      } else {
        console.log(`   ✅ Founder Status: Already "founder"`)
        results.badgesSkipped++
      }

      // Update profile if needed
      if (needsUpdate) {
        if (DRY_RUN) {
          console.log('   ⏭️  Would update (dry run)\n')
          if (updates.credits) results.creditsUpdated++
          if (updates.founder_status) results.badgesAdded++
        } else {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (updateError) {
            console.log(`   ❌ Failed to update: ${updateError.message}\n`)
            results.errors.push({
              user: user.email,
              error: updateError.message
            })
          } else {
            console.log('   ✅ Updated successfully\n')
            if (updates.credits) results.creditsUpdated++
            if (updates.founder_status) results.badgesAdded++
          }
        }
      } else {
        console.log('   ℹ️  No updates needed\n')
      }
    }

    // Step 4: Print summary
    printSummary()

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

function printSummary() {
  console.log('\n')
  console.log('================================================')
  console.log('📊 SUMMARY')
  console.log('================================================')
  console.log(`Total Users:              ${results.totalUsers}`)
  console.log(`Credits Updated:          ${results.creditsUpdated} ✅`)
  console.log(`Credits Skipped:          ${results.creditsSkipped} (already ≥ ${MIN_CREDITS})`)
  console.log(`Founder Badges Added:     ${results.badgesAdded} 🏆`)
  console.log(`Founder Badges Skipped:   ${results.badgesSkipped} (already had)`)
  console.log(`Errors:                   ${results.errors.length} ❌`)
  console.log('================================================')

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.user}: ${err.error}`)
    })
  }

  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made')
    console.log('Set DRY_RUN = false to apply changes')
  } else {
    console.log('\n✅ Credits and badges updated successfully!')
    console.log('\n🎁 What users received:')
    console.log('─────────────────────────────────────')
    console.log(`💰 ${results.creditsUpdated} users: Credits set to ${MIN_CREDITS}`)
    console.log(`🏆 ${results.badgesAdded} users: Founder badge added`)
    console.log(`✅ ${results.creditsSkipped} users: Already had ≥ ${MIN_CREDITS} credits`)
    console.log(`✅ ${results.badgesSkipped} users: Already had founder badge`)
  }
}

// Run script
giveCreditsAndBadges().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

