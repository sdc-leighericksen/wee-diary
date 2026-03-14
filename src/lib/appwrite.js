import { Client, Account, Databases, Query, ID } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const databases = new Databases(client)

const DB = import.meta.env.VITE_APPWRITE_DATABASE_ID
const ENTRIES = import.meta.env.VITE_APPWRITE_ENTRIES_COLLECTION_ID
const REMINDERS = import.meta.env.VITE_APPWRITE_REMINDERS_COLLECTION_ID

export { client, ID, Query }

// Verify Appwrite connectivity
export async function pingAppwrite() {
  try {
    const result = await client.ping()
    console.log('Appwrite connected:', result)
    return true
  } catch (e) {
    console.error('Appwrite connection failed:', e.message)
    return false
  }
}

// Auth
export async function login(email, password) {
  return account.createEmailPasswordSession(email, password)
}

export async function logout() {
  return account.deleteSession('current')
}

export async function getUser() {
  return account.get()
}

// Strip null/undefined values so Appwrite doesn't reject unknown or non-nullable attributes
function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  )
}

// Entries
export async function createEntry(data) {
  return databases.createDocument(DB, ENTRIES, ID.unique(), clean(data))
}

export async function listEntries(userId, startDate, endDate, limit = 100, offset = 0) {
  const queries = [
    Query.equal('userId', userId),
    Query.greaterThanEqual('timestamp', startDate),
    Query.lessThanEqual('timestamp', endDate),
    Query.orderDesc('timestamp'),
    Query.limit(limit),
    Query.offset(offset)
  ]
  return databases.listDocuments(DB, ENTRIES, queries)
}

export async function updateEntry(id, data) {
  return databases.updateDocument(DB, ENTRIES, id, clean(data))
}

export async function deleteEntry(id) {
  return databases.deleteDocument(DB, ENTRIES, id)
}

// Reminders
export async function getReminders(userId) {
  const res = await databases.listDocuments(DB, REMINDERS, [
    Query.equal('userId', userId),
    Query.limit(1)
  ])
  return res.documents[0] || null
}

export async function saveReminders(userId, data) {
  const existing = await getReminders(userId)
  if (existing) {
    return databases.updateDocument(DB, REMINDERS, existing.$id, data)
  }
  return databases.createDocument(DB, REMINDERS, ID.unique(), { userId, ...data })
}
