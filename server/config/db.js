const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * - Try the configured URI first (MONGODB_URI or MONGO_URI).
 * - If that fails and we're in development, try a local MongoDB at mongodb://127.0.0.1:27017/mern_stack
 * - Throw the original error if all attempts fail.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGODB_URI (or MONGO_URI) not defined in environment');
  }

  const commonOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Make initial server selection timeout a little faster so dev fallback doesn't wait too long
    serverSelectionTimeoutMS: 10000,
  };

  try {
    await mongoose.connect(uri, commonOpts);
    return mongoose.connection;
  } catch (primaryErr) {
    console.error('Primary MongoDB connection failed:', primaryErr.message || primaryErr);

    // In development, attempt a local MongoDB fallback to make local dev smoother
    if (process.env.NODE_ENV !== 'production') {
      const localUri = 'mongodb://127.0.0.1:27017/mern_stack';
      console.warn(`Attempting fallback to local MongoDB at ${localUri} (development only)...`);
      try {
        await mongoose.connect(localUri, commonOpts);
        console.log('Connected to local MongoDB fallback');
        return mongoose.connection;
      } catch (fallbackErr) {
        console.error('Local MongoDB fallback failed:', fallbackErr.message || fallbackErr);
        // rethrow the original error to preserve context
        throw primaryErr;
      }
    }

    // If we're in production or fallback not allowed, rethrow the original error
    throw primaryErr;
  }
};

module.exports = connectDB;
