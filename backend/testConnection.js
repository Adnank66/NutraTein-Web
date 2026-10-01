/**
 * testConnection.js — Temporary MongoDB Atlas connection & write test
 * Run: node backend/testConnection.js
 * Delete after confirming Atlas works.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('Error: No MONGO_URI found in backend/.env');
  process.exit(1);
}

// Mask credentials for safe logging
const safeUri = MONGO_URI.replace(/:\/\/([^:]+):([^@]+)@/, '://<username>:****@');
console.log('\nConnecting to:', safeUri);
console.log('Database name from URI:', (() => {
  try {
    const url = new URL(MONGO_URI);
    return url.pathname.replace('/', '') || '(MISSING - no DB name in URI!)';
  } catch {
    return '(could not parse URI)';
  }
})());

// Minimal test schema - does NOT affect real collections
const testSchema = new mongoose.Schema({
  testField: String,
  createdAt: { type: Date, default: Date.now }
});
const TestDoc = mongoose.model('_connection_test', testSchema);

async function runTest() {
  try {
    console.log('\nConnecting (timeout: 10s)...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log('Connected! Host: ' + host + '  Database: "' + dbName + '"');

    // Insert test document
    console.log('\nInserting test document...');
    const doc = await TestDoc.create({ testField: 'PROTEINX Atlas connection test OK' });
    console.log('Inserted _id:', doc._id.toString());
    console.log('testField   :', doc.testField);

    // Read it back
    console.log('\nReading back from Atlas...');
    const found = await TestDoc.findById(doc._id);
    if (found) {
      console.log('READ SUCCESS:', JSON.stringify(found.toObject(), null, 2));
    } else {
      console.log('FAILED: Document not found on read-back!');
    }

    // Clean up
    await TestDoc.deleteOne({ _id: doc._id });
    console.log('\nTest document deleted (cleanup done).');
    console.log('\nALL STEPS PASSED - Atlas is connected and writes are working!');
    console.log('\nIn Atlas Data Explorer, look for:');
    console.log('  Database   : ' + dbName);
    console.log('  Collections: users, products, categories, orders, reviews, coupons, banners, adminlogs, recommendationstats\n');

  } catch (err) {
    console.error('\nCONNECTION/WRITE FAILED');
    console.error('Error name   :', err.name);
    console.error('Error message:', err.message);

    if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('timed out')) {
      console.error('\nFIX: Your IP is likely not whitelisted in Atlas.');
      console.error('  Go to Atlas -> Network Access -> Add IP Address -> 0.0.0.0/0 (dev) or your real IP.');
    } else if (err.message.includes('Authentication failed') || err.message.includes('bad auth')) {
      console.error('\nFIX: Wrong username or password in MONGO_URI.');
      console.error('  Go to Atlas -> Database Access -> verify DB user credentials.');
    } else if (err.message.includes('localhost')) {
      console.error('\nFIX: You are using a local URI. Replace MONGO_URI in backend/.env with your Atlas SRV string.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected cleanly.\n');
  }
}

runTest();
