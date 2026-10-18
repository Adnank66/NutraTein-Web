/**
 * Central MongoDB connection helper using Mongoose.
 * 
 * Cached for Next.js hot reload / serverless execution environments.
 * Reads connection string strictly from process.env.MONGODB_URI (or process.env.DATABASE_URL fallback).
 * Never logs raw connection strings or secrets.
 */

const mongoose = require('mongoose');

// Attempt loading dotenv for standalone Node CLI scripts
if (typeof process !== 'undefined' && process.env && !process.env.MONGODB_URI) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv might be handled by Next.js automatically
  }
}

let cached = global.mongooseConnection;

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!rawUri) {
    throw new Error('Please configure MONGODB_URI in your .env file.');
  }

  // Sanitize any enclosing quotes
  const uri = rawUri.trim().replace(/^["']|["']$/g, '');

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      const dbName = m.connection.name;
      const host = m.connection.host;
      if (process.env.NODE_ENV !== 'test') {
        console.log(`✅ MongoDB Mongoose connected: ${host} (Database: ${dbName})`);
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectToDatabase;
module.exports.connectToDatabase = connectToDatabase;
module.exports.default = connectToDatabase;
module.exports.mongoose = mongoose;
