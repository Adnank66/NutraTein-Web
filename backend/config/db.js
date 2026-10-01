const mongoose = require('mongoose');

// Prevent Mongoose from crashing process on unhandled connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

const connectDB = async () => {
  // Support both MONGODB_URI (standard) and MONGO_URI (legacy project variable)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log(`ℹ️  No MongoDB URI provided in .env.`);
    console.log(`⚡ Activated embedded in-memory catalog mode. All store pages, search, cart, and orders work seamlessly!`);
    global.USE_MONGODB = false;
    return;
  }

  const isAtlas = uri.includes('mongodb.net') || uri.startsWith('mongodb+srv://');
  const timeoutMS = isAtlas ? 10000 : 2000;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMS,
      socketTimeoutMS: 30000,
      autoIndex: process.env.NODE_ENV !== 'production',
      tlsAllowInvalidCertificates: true,
    });
    const dbName = conn.connection.name;
    const host = conn.connection.host;
    console.log(`✅ MongoDB Connected: ${host}  →  Database: "${dbName}"`);
    global.USE_MONGODB = true;
  } catch (error) {
    if (isAtlas) {
      console.error(`❌ Failed to connect to MongoDB Atlas: ${error.message}`);
      console.error('   Check: (1) MONGODB_URI in .env has correct credentials, (2) your IP is whitelisted in Atlas Network Access, (3) database name is included in the URI.');
    } else {
      console.log(`ℹ️  Local MongoDB not active on ${uri || 'localhost:27017'}.`);
    }
    console.log(`⚡ Activated embedded in-memory catalog mode. All store pages, search, cart, and orders work seamlessly!`);
    global.USE_MONGODB = false;
  }
};

module.exports = connectDB;