/**
 * Appwrite Setup Script for Wee Diary
 *
 * Run this once to create the database, collections, attributes, and indexes.
 *
 * Usage:
 *   1. Fill in APPWRITE_API_KEY below (create one in Appwrite Console > Project Settings > API Keys)
 *      - Grant permissions: databases.read, databases.write, collections.read, collections.write,
 *        attributes.read, attributes.write, indexes.read, indexes.write
 *   2. Fill in PROJECT_ID with your Appwrite project ID
 *   3. Run: node scripts/setup-appwrite.mjs
 */

import { Client, Databases, ID } from 'node-appwrite'

// ============== CONFIGURE THESE ==============
const ENDPOINT = 'https://appwrite.nimbuscloud.au/v1'
const PROJECT_ID = '69b3fe420015afd3fb3e' // <-- paste your project ID here
const API_KEY = 'standard_6e2d7f38cbac6d12a40067626324b6111745c75c17d70c614d0517e6d8de605d5b41ffe8acdd7cd1756533869ed58e17093b14405e2efcdadf766a8eb2a105974d7db08cc133b0df843e5ef56a4004be6312dc4cba89d6045ba985b843e255286065e4a193c85232c0bca163dcc4096a6c75ae45944301492e386de45bf42714'    // <-- paste your API key here
// =============================================

if (!PROJECT_ID || !API_KEY) {
  console.error('❌ Please set PROJECT_ID and API_KEY in this script before running.')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const db = new Databases(client)

const DB_ID = 'wee-diary-db'
const ENTRIES_ID = 'diary_entries'
const REMINDERS_ID = 'reminders'

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('🔧 Setting up Wee Diary database...\n')

  // 1. Create database
  try {
    await db.create(DB_ID, 'Wee Diary DB')
    console.log('✅ Database created: wee-diary-db')
  } catch (e) {
    if (e.code === 409) console.log('⏩ Database already exists')
    else throw e
  }

  // 2. Create diary_entries collection
  try {
    await db.createCollection(DB_ID, ENTRIES_ID, 'diary_entries', [
      // Document-level security: users can CRUD their own docs
    ], true) // documentSecurity = true
    console.log('✅ Collection created: diary_entries')
  } catch (e) {
    if (e.code === 409) console.log('⏩ diary_entries already exists')
    else throw e
  }

  // 3. Create diary_entries attributes
  const entryAttrs = [
    () => db.createStringAttribute(DB_ID, ENTRIES_ID, 'userId', 255, true),
    () => db.createDatetimeAttribute(DB_ID, ENTRIES_ID, 'timestamp', true),
    () => db.createStringAttribute(DB_ID, ENTRIES_ID, 'entryType', 50, true),
    () => db.createStringAttribute(DB_ID, ENTRIES_ID, 'fluidType', 255, false),
    () => db.createIntegerAttribute(DB_ID, ENTRIES_ID, 'fluidAmount', false),
    () => db.createIntegerAttribute(DB_ID, ENTRIES_ID, 'urineAmount', false),
    () => db.createIntegerAttribute(DB_ID, ENTRIES_ID, 'urgencyLevel', false, undefined, 1, 5),
    () => db.createBooleanAttribute(DB_ID, ENTRIES_ID, 'leaked', false),
    () => db.createStringAttribute(DB_ID, ENTRIES_ID, 'leakSize', 50, false),
    () => db.createBooleanAttribute(DB_ID, ENTRIES_ID, 'padChanged', false),
    () => db.createStringAttribute(DB_ID, ENTRIES_ID, 'activityNotes', 1000, false),
    () => db.createDatetimeAttribute(DB_ID, ENTRIES_ID, 'createdAt', true),
  ]

  for (const create of entryAttrs) {
    try {
      await create()
      await sleep(1500) // Appwrite needs time between attribute creations
    } catch (e) {
      if (e.code === 409) continue // already exists
      console.warn('⚠️  Attribute warning:', e.message)
    }
  }
  console.log('✅ diary_entries attributes created')

  // Wait for attributes to be ready
  console.log('⏳ Waiting for attributes to process...')
  await sleep(5000)

  // 4. Create diary_entries indexes
  try {
    await db.createIndex(DB_ID, ENTRIES_ID, 'idx_user_timestamp', 'key',
      ['userId', 'timestamp'], ['ASC', 'DESC'])
    console.log('✅ Index created: idx_user_timestamp')
  } catch (e) {
    if (e.code === 409) console.log('⏩ Index already exists')
    else console.warn('⚠️  Index warning:', e.message)
  }

  // 5. Create reminders collection
  try {
    await db.createCollection(DB_ID, REMINDERS_ID, 'reminders', [], true)
    console.log('✅ Collection created: reminders')
  } catch (e) {
    if (e.code === 409) console.log('⏩ reminders already exists')
    else throw e
  }

  // 6. Create reminders attributes
  const reminderAttrs = [
    () => db.createStringAttribute(DB_ID, REMINDERS_ID, 'userId', 255, true),
    () => db.createStringAttribute(DB_ID, REMINDERS_ID, 'reminderTimes', 10, true, undefined, true), // array
    () => db.createBooleanAttribute(DB_ID, REMINDERS_ID, 'enabled', true),
    () => db.createStringAttribute(DB_ID, REMINDERS_ID, 'pushSubscription', 4000, false),
  ]

  for (const create of reminderAttrs) {
    try {
      await create()
      await sleep(1500)
    } catch (e) {
      if (e.code === 409) continue
      console.warn('⚠️  Attribute warning:', e.message)
    }
  }
  console.log('✅ reminders attributes created')

  await sleep(3000)

  // 7. Create reminders index
  try {
    await db.createIndex(DB_ID, REMINDERS_ID, 'idx_userId', 'key', ['userId'], ['ASC'])
    console.log('✅ Index created: idx_userId')
  } catch (e) {
    if (e.code === 409) console.log('⏩ Index already exists')
    else console.warn('⚠️  Index warning:', e.message)
  }

  console.log('\n🎉 Setup complete!')
  console.log('\n📋 Next steps:')
  console.log('   1. Go to Appwrite Console > Auth > Users > Create User')
  console.log('      Email: diary@family.com (or whatever you like)')
  console.log('      Password: a shared password the family knows')
  console.log('   2. Go to each collection > Settings > Permissions:')
  console.log('      Add role "Users" with Create, Read, Update, Delete')
  console.log(`   3. Update .env with: VITE_APPWRITE_PROJECT_ID=${PROJECT_ID}`)
  console.log('   4. Generate VAPID keys: npx web-push generate-vapid-keys')
  console.log('      Put the public key in .env as VITE_VAPID_PUBLIC_KEY')
}

main().catch(e => {
  console.error('❌ Setup failed:', e.message)
  process.exit(1)
})
