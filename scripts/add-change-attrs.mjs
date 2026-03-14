import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint('https://appwrite.nimbuscloud.au/v1')
  .setProject('69b3fe420015afd3fb3e')
  .setKey('standard_6e2d7f38cbac6d12a40067626324b6111745c75c17d70c614d0517e6d8de605d5b41ffe8acdd7cd1756533869ed58e17093b14405e2efcdadf766a8eb2a105974d7db08cc133b0df843e5ef56a4004be6312dc4cba89d6045ba985b843e255286065e4a193c85232c0bca163dcc4096a6c75ae45944301492e386de45bf42714')

const db = new Databases(client)
const DB_ID = 'wee-diary-db'
const ENTRIES_ID = 'diary_entries'

async function main() {
  console.log('Adding change attributes to diary_entries...')
  try {
    await db.createStringAttribute(DB_ID, ENTRIES_ID, 'changeFullness', 50, false)
    console.log('✅ changeFullness added')
  } catch (e) {
    if (e.code === 409) console.log('⏩ changeFullness already exists')
    else console.warn('⚠️', e.message)
  }
  await new Promise(r => setTimeout(r, 1500))
  try {
    await db.createStringAttribute(DB_ID, ENTRIES_ID, 'changeReason', 100, false)
    console.log('✅ changeReason added')
  } catch (e) {
    if (e.code === 409) console.log('⏩ changeReason already exists')
    else console.warn('⚠️', e.message)
  }
  console.log('Done!')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
