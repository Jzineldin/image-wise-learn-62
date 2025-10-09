/**
 * Tale Forge - Stories & Characters Migration (Simplified)
 * 
 * This script ONLY migrates stories and characters for users that already exist.
 * It does NOT create users or update profiles.
 * 
 * Prerequisites:
 * - npm install @supabase/supabase-js
 * - Users must already exist in both projects
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Old project (source) - fyihypkigbcmsxyvseca
const OLD_PROJECT_URL = 'https://fyihypkigbcmsxyvseca.supabase.co'
const OLD_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5aWh5cGtpZ2JjbXN4eXZzZWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMzc2MCwiZXhwIjoyMDY2ODA5NzYwfQ.3w-YsZFoHGkQ_uBoZBVaV0fBShWm5o-w1xrTva-buL0'

// New project (destination) - hlrvpuqwurtdbjkramcp
const NEW_PROJECT_URL = 'https://hlrvpuqwurtdbjkramcp.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscnZwdXF3dXJ0ZGJqa3JhbWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY5MzIxMiwiZXhwIjoyMDczMjY5MjEyfQ.2ZuTzaa-47H2VShaW-onxpcGi93QUsc6yIcgUhYoLgo'

// Options
const DRY_RUN = false // Set to true to test without making changes

// ============================================================================
// SCRIPT START
// ============================================================================

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_SERVICE_ROLE_KEY)
const newSupabase = createClient(NEW_PROJECT_URL, NEW_SERVICE_ROLE_KEY)

// Track results
const results = {
  usersProcessed: 0,
  storiesMigrated: 0,
  storiesFailed: 0,
  charactersMigrated: 0,
  charactersFailed: 0,
  errors: []
}

/**
 * Main migration function
 */
async function migrateStoriesAndCharacters() {
  console.log('🚀 Starting Stories & Characters Migration')
  console.log('==========================================')
  console.log(`📊 Old Project: ${OLD_PROJECT_URL}`)
  console.log(`📊 New Project: ${NEW_PROJECT_URL}`)
  console.log(`🔧 Dry Run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO (will migrate data)'}`)
  console.log('==========================================\n')

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No data will be migrated\n')
  }

  try {
    // Step 1: Get ALL users from NEW project (with pagination)
    console.log('📥 Step 1: Fetching users from NEW project...')

    let newUsers = []
    let newPage = 1
    let newHasMore = true

    while (newHasMore) {
      const { data, error } = await newSupabase.auth.admin.listUsers({
        page: newPage,
        perPage: 1000
      })

      if (error) {
        console.error('❌ Error fetching users from new project:', error)
        return
      }

      if (data && data.users && data.users.length > 0) {
        newUsers = newUsers.concat(data.users)
        console.log(`   Fetched page ${newPage}: ${data.users.length} users (total: ${newUsers.length})`)

        if (data.users.length < 1000) {
          newHasMore = false
        } else {
          newPage++
        }
      } else {
        newHasMore = false
      }
    }

    console.log(`✅ Found ${newUsers.length} users in new project\n`)

    // Step 2: Get ALL users from OLD project (with pagination)
    console.log('📥 Step 2: Fetching users from OLD project...')

    let oldUsers = []
    let oldPage = 1
    let oldHasMore = true

    while (oldHasMore) {
      const { data, error } = await oldSupabase.auth.admin.listUsers({
        page: oldPage,
        perPage: 1000
      })

      if (error) {
        console.error('❌ Error fetching users from old project:', error)
        return
      }

      if (data && data.users && data.users.length > 0) {
        oldUsers = oldUsers.concat(data.users)
        console.log(`   Fetched page ${oldPage}: ${data.users.length} users (total: ${oldUsers.length})`)

        if (data.users.length < 1000) {
          oldHasMore = false
        } else {
          oldPage++
        }
      } else {
        oldHasMore = false
      }
    }

    console.log(`✅ Found ${oldUsers.length} users in old project\n`)

    // Step 3: Create email-to-ID maps for both projects
    const newUsersMap = new Map()
    newUsers.forEach(user => {
      newUsersMap.set(user.email, user.id)
    })

    const oldUsersMap = new Map()
    oldUsers.forEach(user => {
      oldUsersMap.set(user.email, user.id)
    })

    // Step 4: Find matching users (users that exist in both projects)
    console.log('🔍 Step 3: Finding matching users...')
    const matchingUsers = []
    
    for (const [email, newUserId] of newUsersMap) {
      const oldUserId = oldUsersMap.get(email)
      if (oldUserId) {
        matchingUsers.push({
          email,
          oldUserId,
          newUserId
        })
      }
    }
    
    console.log(`✅ Found ${matchingUsers.length} matching users\n`)

    if (matchingUsers.length === 0) {
      console.log('⚠️  No matching users found. Nothing to migrate.')
      return
    }

    // Step 5: Migrate stories and characters for each matching user
    console.log('📚 Step 4: Migrating stories and characters...\n')
    
    for (let i = 0; i < matchingUsers.length; i++) {
      const user = matchingUsers[i]
      console.log(`👤 [${i + 1}/${matchingUsers.length}] Processing: ${user.email}`)
      console.log('─────────────────────────────────────')
      
      try {
        await migrateUserData(user)
        results.usersProcessed++
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message)
        results.errors.push({
          user: user.email,
          error: error.message
        })
      }
      
      console.log('')
    }

    // Step 6: Print summary
    printSummary()

  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
  }
}

/**
 * Migrate stories and characters for a single user
 */
async function migrateUserData(user) {
  const { email, oldUserId, newUserId } = user

  // Migrate stories
  console.log('  📚 Fetching stories from old project...')
  
  const { data: oldStories, error: storiesFetchError } = await oldSupabase
    .from('stories')
    .select('*')
    .eq('user_id', oldUserId)
  
  if (storiesFetchError) {
    console.log(`  ⚠️  Error fetching stories: ${storiesFetchError.message}`)
  } else if (!oldStories || oldStories.length === 0) {
    console.log('  ℹ️  No stories to migrate')
  } else if (DRY_RUN) {
    console.log(`  ⏭️  Would migrate ${oldStories.length} stories (dry run)`)
  } else {
    console.log(`  📚 Migrating ${oldStories.length} stories...`)
    
    for (const story of oldStories) {
      // Remove the old ID and user_id, let Supabase generate new ones
      const { id, user_id, ...storyData } = story
      
      const { error: storyError } = await newSupabase
        .from('stories')
        .insert({
          ...storyData,
          user_id: newUserId, // Use new user ID
          created_at: story.created_at,
          updated_at: story.updated_at || new Date().toISOString()
        })
      
      if (storyError) {
        console.log(`    ❌ Story "${story.title}" failed: ${storyError.message}`)
        results.storiesFailed++
      } else {
        results.storiesMigrated++
      }
    }
    
    console.log(`  ✅ Migrated ${oldStories.length} stories`)
  }

  // Migrate characters
  console.log('  🎭 Fetching characters from old project...')
  
  const { data: oldCharacters, error: charactersFetchError } = await oldSupabase
    .from('user_characters')
    .select('*')
    .eq('user_id', oldUserId)
  
  if (charactersFetchError) {
    console.log(`  ⚠️  Error fetching characters: ${charactersFetchError.message}`)
  } else if (!oldCharacters || oldCharacters.length === 0) {
    console.log('  ℹ️  No characters to migrate')
  } else if (DRY_RUN) {
    console.log(`  ⏭️  Would migrate ${oldCharacters.length} characters (dry run)`)
  } else {
    console.log(`  🎭 Migrating ${oldCharacters.length} characters...`)
    
    for (const character of oldCharacters) {
      // Remove the old ID and user_id, let Supabase generate new ones
      const { id, user_id, ...characterData } = character
      
      const { error: characterError } = await newSupabase
        .from('user_characters')
        .insert({
          ...characterData,
          user_id: newUserId, // Use new user ID
          created_at: character.created_at,
          updated_at: character.updated_at || new Date().toISOString()
        })
      
      if (characterError) {
        console.log(`    ❌ Character "${character.name}" failed: ${characterError.message}`)
        results.charactersFailed++
      } else {
        results.charactersMigrated++
      }
    }
    
    console.log(`  ✅ Migrated ${oldCharacters.length} characters`)
  }

  console.log(`  ✅ Migration complete for ${email}`)
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n\n')
  console.log('==========================================')
  console.log('📊 MIGRATION SUMMARY')
  console.log('==========================================')
  console.log(`Users Processed:       ${results.usersProcessed}`)
  console.log(`Stories Migrated:      ${results.storiesMigrated} ✅`)
  console.log(`Stories Failed:        ${results.storiesFailed} ❌`)
  console.log(`Characters Migrated:   ${results.charactersMigrated} ✅`)
  console.log(`Characters Failed:     ${results.charactersFailed} ❌`)
  console.log('==========================================')
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.user}: ${err.error}`)
    })
  }
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a DRY RUN - no data was actually migrated')
    console.log('Set DRY_RUN = false to perform actual migration')
  } else {
    console.log('\n✅ Migration complete!')
  }
}

// Run migration
migrateStoriesAndCharacters().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

