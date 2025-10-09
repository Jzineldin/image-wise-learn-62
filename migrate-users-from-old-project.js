/**
 * Tale Forge - User Migration Script
 * 
 * Migrates users from old project (fyihypkigbcmsxyvseca) to new project
 * 
 * What this script does:
 * 1. Fetches all users from old project (auth.users)
 * 2. Fetches all profiles from old project (profiles table)
 * 3. Creates users in new project with same emails
 * 4. Creates profiles in new project
 * 5. Optionally migrates stories, characters, credits
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 * - Get service_role keys from both projects
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// Old project (source) - fyihypkigbcmsxyvseca
const OLD_PROJECT_URL = 'https://fyihypkigbcmsxyvseca.supabase.co'
const OLD_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWh5cGtpZ2JjbXN4eXZzZWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMzc2MCwiZXhwIjoyMDY2ODA5NzYwfQ.3w-YsZFoHGkQ_uBoZBVaV0fBShWm5o-w1xrTva-buL0'

// New project (destination) - hlrvpuqwurtdbjkramcp (Tale Forge V3)
const NEW_PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

// Migration options
const MIGRATE_OPTIONS = {
  migrateUsers: true,        // Migrate auth users
  migrateProfiles: true,     // Migrate profile data
  migrateStories: true,      // Migrate user stories
  migrateCharacters: true,   // Migrate user characters
  migrateCredits: true,      // Migrate credit balances
  sendPasswordResets: true,  // Send password reset emails to users
  dryRun: false,             // REAL MIGRATION - WILL MAKE CHANGES!
}

// ============================================================================
// SCRIPT START
// ============================================================================

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY)
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY)

// Track migration results
const results = {
  usersTotal: 0,
  usersSuccess: 0,
  usersFailed: 0,
  profilesSuccess: 0,
  profilesFailed: 0,
  storiesSuccess: 0,
  storiesFailed: 0,
  charactersSuccess: 0,
  charactersFailed: 0,
  errors: []
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('🚀 Starting Tale Forge User Migration')
  console.log('=====================================')
  console.log(`📊 Old Project: ${OLD_PROJECT_URL}`)
  console.log(`📊 New Project: ${NEW_PROJECT_URL}`)
  console.log(`🔧 Dry Run: ${MIGRATE_OPTIONS.dryRun ? 'YES (no changes will be made)' : 'NO (will migrate data)'}`)
  console.log('=====================================\n')

  if (MIGRATE_OPTIONS.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be migrated\n')
  }

  try {
    // Step 1: Fetch ALL users from old project (with pagination)
    console.log('📥 Step 1: Fetching users from old project...')

    let allUsers = []
    let page = 1
    let perPage = 1000 // Max per page
    let hasMore = true

    while (hasMore) {
      const { data, error: fetchError } = await oldSupabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      })

      if (fetchError) {
        console.error('❌ Error fetching users:', fetchError)
        return
      }

      if (data && data.users && data.users.length > 0) {
        allUsers = allUsers.concat(data.users)
        console.log(`   Fetched page ${page}: ${data.users.length} users (total so far: ${allUsers.length})`)

        // Check if there are more pages
        if (data.users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      } else {
        hasMore = false
      }
    }

    const oldUsers = { users: allUsers }
    results.usersTotal = oldUsers.users.length
    console.log(`✅ Found ${results.usersTotal} users to migrate\n`)

    if (results.usersTotal === 0) {
      console.log('⚠️  No users found to migrate')
      return
    }

    // Step 2: Fetch ALL existing users from new project (to avoid repeated API calls)
    console.log('📥 Step 2: Fetching existing users from new project...')

    let allNewUsers = []
    let newPage = 1
    let newHasMore = true

    while (newHasMore) {
      const { data, error: fetchError } = await newSupabase.auth.admin.listUsers({
        page: newPage,
        perPage: perPage
      })

      if (fetchError) {
        console.error('❌ Error fetching existing users:', fetchError)
        return
      }

      if (data && data.users && data.users.length > 0) {
        allNewUsers = allNewUsers.concat(data.users)

        if (data.users.length < perPage) {
          newHasMore = false
        } else {
          newPage++
        }
      } else {
        newHasMore = false
      }
    }

    console.log(`✅ Found ${allNewUsers.length} existing users in new project\n`)

    // Create a map of existing users by email for fast lookup
    const existingUsersMap = new Map()
    allNewUsers.forEach(user => {
      existingUsersMap.set(user.email, user)
    })

    // Step 3: Migrate each user
    for (let i = 0; i < oldUsers.users.length; i++) {
      const user = oldUsers.users[i]
      console.log(`\n👤 [${i + 1}/${results.usersTotal}] Migrating user: ${user.email}`)
      console.log('─────────────────────────────────────')

      try {
        await migrateUser(user, existingUsersMap)
      } catch (error) {
        console.error(`❌ Unexpected error migrating ${user.email}:`, error.message)
        results.usersFailed++
        results.errors.push({
          user: user.email,
          error: error.message
        })
      }
    }

    // Step 3: Print summary
    printSummary()

  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
  }
}

/**
 * Migrate a single user and their data
 */
async function migrateUser(oldUser, existingUsersMap) {
  const userEmail = oldUser.email
  let newUserId = null
  let userAlreadyExists = false

  // Step 1: Check if user already exists in new project (using the map)
  if (MIGRATE_OPTIONS.dryRun) {
    console.log('  📝 Creating auth user...')
    console.log('  ⏭️  Skipped (dry run)')
    newUserId = 'dry-run-user-id'
  } else {
    // Check if user already exists using the map
    const existingUser = existingUsersMap.get(userEmail)

    if (existingUser) {
      userAlreadyExists = true
      newUserId = existingUser.id
      console.log('  ⚠️  User already exists in new project')
      console.log('  ✅ Using existing user ID - will migrate data only')
    } else {
      // User doesn't exist, create new auth user
      console.log('  📝 Creating auth user...')

      const { data: newUser, error: createError } = await newSupabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true, // Auto-confirm email
        user_metadata: oldUser.user_metadata || {},
        app_metadata: oldUser.app_metadata || {},
      })

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      newUserId = newUser.user.id
      console.log('  ✅ Auth user created')
      results.usersSuccess++
    }
  }

  // Step 2: Migrate profile
  if (MIGRATE_OPTIONS.migrateProfiles && newUserId) {
    console.log('  📝 Migrating profile...')

    const { data: oldProfile, error: profileFetchError } = await oldSupabase
      .from('profiles')
      .select('*')
      .eq('id', oldUser.id)
      .single()

    if (profileFetchError) {
      console.log('  ⚠️  No profile found in old project')
    } else if (MIGRATE_OPTIONS.dryRun) {
      console.log('  ⏭️  Skipped (dry run)')
      console.log(`     Profile data: ${JSON.stringify(oldProfile, null, 2)}`)
    } else {
      const { error: profileError } = await newSupabase
        .from('profiles')
        .upsert({
          id: newUserId,
          email: oldProfile.email,
          username: oldProfile.username,
          full_name: oldProfile.full_name,
          avatar_url: oldProfile.avatar_url,
          bio: oldProfile.bio,
          role: oldProfile.role || 'user',
          signup_method: oldProfile.signup_method || 'email',
          preferences: oldProfile.preferences || {},
          reading_level: oldProfile.reading_level || 'beginner',
          credits: oldProfile.credits || 10,
          subscription_tier: oldProfile.subscription_tier || 'free',
          subscription_status: oldProfile.subscription_status || 'active',
          stripe_customer_id: oldProfile.stripe_customer_id,
          stripe_subscription_id: oldProfile.stripe_subscription_id,
          created_at: oldProfile.created_at,
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.log(`  ❌ Profile migration failed: ${profileError.message}`)
        results.profilesFailed++
      } else {
        console.log(`  ✅ Profile migrated (${oldProfile.credits || 10} credits)`)
        results.profilesSuccess++
      }
    }
  }

  // Step 3: Migrate stories
  if (MIGRATE_OPTIONS.migrateStories && newUserId) {
    console.log('  📝 Migrating stories...')
    
    const { data: oldStories, error: storiesFetchError } = await oldSupabase
      .from('stories')
      .select('*')
      .eq('user_id', oldUser.id)
    
    if (storiesFetchError) {
      console.log('  ⚠️  Error fetching stories')
    } else if (!oldStories || oldStories.length === 0) {
      console.log('  ℹ️  No stories to migrate')
    } else if (MIGRATE_OPTIONS.dryRun) {
      console.log(`  ⏭️  Would migrate ${oldStories.length} stories (dry run)`)
    } else {
      console.log(`  📚 Migrating ${oldStories.length} stories...`)
      
      for (const story of oldStories) {
        const { error: storyError } = await newSupabase
          .from('stories')
          .insert({
            ...story,
            user_id: newUserId,
            id: undefined, // Let Supabase generate new ID
            created_at: story.created_at,
            updated_at: new Date().toISOString()
          })
        
        if (storyError) {
          console.log(`    ❌ Story "${story.title}" failed: ${storyError.message}`)
          results.storiesFailed++
        } else {
          results.storiesSuccess++
        }
      }
      
      console.log(`  ✅ Migrated ${oldStories.length} stories`)
    }
  }

  // Step 4: Migrate characters
  if (MIGRATE_OPTIONS.migrateCharacters && newUserId) {
    console.log('  📝 Migrating characters...')
    
    const { data: oldCharacters, error: charactersFetchError } = await oldSupabase
      .from('user_characters')
      .select('*')
      .eq('user_id', oldUser.id)
    
    if (charactersFetchError) {
      console.log('  ⚠️  Error fetching characters')
    } else if (!oldCharacters || oldCharacters.length === 0) {
      console.log('  ℹ️  No characters to migrate')
    } else if (MIGRATE_OPTIONS.dryRun) {
      console.log(`  ⏭️  Would migrate ${oldCharacters.length} characters (dry run)`)
    } else {
      console.log(`  🎭 Migrating ${oldCharacters.length} characters...`)
      
      for (const character of oldCharacters) {
        const { error: characterError } = await newSupabase
          .from('user_characters')
          .insert({
            ...character,
            user_id: newUserId,
            id: undefined, // Let Supabase generate new ID
            created_at: character.created_at,
            updated_at: new Date().toISOString()
          })
        
        if (characterError) {
          console.log(`    ❌ Character "${character.name}" failed: ${characterError.message}`)
          results.charactersFailed++
        } else {
          results.charactersSuccess++
        }
      }
      
      console.log(`  ✅ Migrated ${oldCharacters.length} characters`)
    }
  }

  // Step 5: Credits are now migrated as part of the profile (see Step 2)
  // This step is kept for backwards compatibility but does nothing
  if (MIGRATE_OPTIONS.migrateCredits && newUserId) {
    // Credits are already migrated in the profile step above
    // No separate user_credits table in the old project
  }

  // Step 6: Send password reset email (only for NEW users, not existing ones)
  if (MIGRATE_OPTIONS.sendPasswordResets && !MIGRATE_OPTIONS.dryRun && !userAlreadyExists) {
    console.log('  📧 Sending password reset email...')

    const { error: resetError } = await newSupabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: 'https://tale-forge.app/reset-password'
    })

    if (resetError) {
      console.log(`  ⚠️  Password reset email failed: ${resetError.message}`)
    } else {
      console.log('  ✅ Password reset email sent')
    }
  } else if (userAlreadyExists && !MIGRATE_OPTIONS.dryRun) {
    console.log('  ℹ️  Skipped password reset (user already exists)')
  }

  console.log(`  ✅ Migration complete for ${userEmail}`)
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n\n')
  console.log('=====================================')
  console.log('📊 MIGRATION SUMMARY')
  console.log('=====================================')
  console.log(`Total Users:           ${results.usersTotal}`)
  console.log(`Users Migrated:        ${results.usersSuccess} ✅`)
  console.log(`Users Failed:          ${results.usersFailed} ❌`)
  console.log(`Profiles Migrated:     ${results.profilesSuccess} ✅`)
  console.log(`Profiles Failed:       ${results.profilesFailed} ❌`)
  console.log(`Stories Migrated:      ${results.storiesSuccess} ✅`)
  console.log(`Stories Failed:        ${results.storiesFailed} ❌`)
  console.log(`Characters Migrated:   ${results.charactersSuccess} ✅`)
  console.log(`Characters Failed:     ${results.charactersFailed} ❌`)
  console.log('=====================================')
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.user}: ${err.error}`)
    })
  }
  
  if (MIGRATE_OPTIONS.dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no data was actually migrated')
    console.log('Set MIGRATE_OPTIONS.dryRun = false to perform actual migration')
  } else {
    console.log('\n✅ Migration complete!')
    
    if (MIGRATE_OPTIONS.sendPasswordResets) {
      console.log('\n📧 Password reset emails have been sent to all users')
      console.log('Users will need to check their email and set a new password')
    }
  }
}

// Run migration
migrateUsers().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

