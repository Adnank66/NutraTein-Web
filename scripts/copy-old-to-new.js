/**
 * NutraTein Data Copy Script: Old MongoDB Atlas -> New MongoDB Atlas
 * 
 * Safely copies documents from OLD_MONGODB_URI to MONGODB_URI.
 * Preserves exact `_id` values so all foreign key references remain intact.
 * Skips documents that already exist in the target database.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function copyOldToNew() {
  console.log('========================================================');
  console.log('📦 NUTRATEIN DATA COPY: Old Database -> New Database');
  console.log('========================================================\n');

  const oldUri = process.env.OLD_MONGODB_URI;
  const newUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!oldUri) {
    console.error('❌ OLD_MONGODB_URI is not set in .env.');
    console.log('ℹ️  To copy data from your previous cluster, add to your .env:');
    console.log('   OLD_MONGODB_URI="mongodb+srv://<old_user>:<old_password>@<old_cluster>.mongodb.net/<db_name>"');
    process.exit(1);
  }

  if (!newUri) {
    console.error('❌ MONGODB_URI is not set in .env.');
    process.exit(1);
  }

  console.log('📡 Connecting to Old MongoDB Cluster...');
  const oldClient = new MongoClient(oldUri);
  await oldClient.connect();
  const oldDb = oldClient.db();
  console.log(`✅ Connected to Old DB: "${oldDb.databaseName}"`);

  console.log('📡 Connecting to New MongoDB Cluster...');
  const newClient = new MongoClient(newUri);
  await newClient.connect();
  const newDb = newClient.db();
  console.log(`✅ Connected to New DB: "${newDb.databaseName}"\n`);

  const collections = await oldDb.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name).filter((n) => !n.startsWith('system.'));

  console.log(`Found ${collectionNames.length} collections in source database.`);
  const summary = [];

  for (const colName of collectionNames) {
    const oldCol = oldDb.collection(colName);
    const newCol = newDb.collection(colName);

    const oldDocs = await oldCol.find({}).toArray();
    let copiedCount = 0;
    let skippedCount = 0;

    for (const doc of oldDocs) {
      const exists = await newCol.findOne({ _id: doc._id });
      if (!exists) {
        await newCol.insertOne(doc);
        copiedCount++;
      } else {
        skippedCount++;
      }
    }

    summary.push({
      Collection: colName,
      SourceCount: oldDocs.length,
      Copied: copiedCount,
      Skipped: skippedCount,
    });
  }

  console.table(summary);
  console.log('\n🎉 Data copy operation completed successfully!\n');

  await oldClient.close();
  await newClient.close();
  process.exit(0);
}

copyOldToNew().catch((err) => {
  console.error('\n❌ Data copy failed:', err.message);
  process.exit(1);
});
