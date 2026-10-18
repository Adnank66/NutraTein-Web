require("dotenv").config()
const mongoose = require("mongoose")

async function fixNullDates() {
  const uri = (process.env.MONGODB_URI || process.env.DATABASE_URL).trim().replace(/^["']|["']$/g, "")
  console.log("Connecting to MongoDB to sanitize null dates...")
  await mongoose.connect(uri, { tlsAllowInvalidCertificates: true })

  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  const now = new Date()

  for (const c of collections) {
    const col = db.collection(c.name)
    const res1 = await col.updateMany(
      { $or: [{ createdAt: null }, { createdAt: { $exists: false } }] },
      { $set: { createdAt: now } }
    )
    const res2 = await col.updateMany(
      { $or: [{ updatedAt: null }, { updatedAt: { $exists: false } }] },
      { $set: { updatedAt: now } }
    )
    if (res1.modifiedCount > 0 || res2.modifiedCount > 0) {
      console.log(`Repaired collection "${c.name}": ${res1.modifiedCount} createdAt, ${res2.modifiedCount} updatedAt`)
    }
  }

  console.log("✅ All null timestamps safely repaired in MongoDB!")
  process.exit(0)
}

fixNullDates().catch((err) => {
  console.error("Error repairing timestamps:", err)
  process.exit(1)
})
