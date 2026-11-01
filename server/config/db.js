import mongoose from 'mongoose';
import env from './env.js';

class Database {
  constructor() {
    this.isConnecting = false;

    mongoose.set('bufferTimeoutMS', 30000);

    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] ✅ Connection established successfully.`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] ❌ Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] ⚠️ Disconnected from cluster. Reconnecting in 3 seconds...');
      setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
          this.connect().catch((err) => {
            console.error('[MongoDB] Auto-reconnect failed:', err.message);
          });
        }
      }, 3000);
    });
  }

  async connect() {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (mongoose.connection.readyState === 2 || this.isConnecting) {
      console.log('[MongoDB] Connection already in progress...');
      return;
    }

    const uri = env.MONGODB_URI || process.env.MONGODB_URI;

    if (!uri) {
      console.error('[MongoDB Error] MONGODB_URI is not set in environment variables.');
      return;
    }

    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 15000, 
      socketTimeoutMS: 45000,
      family: 4, 
    };

    try {
      this.isConnecting = true;
      const conn = await mongoose.connect(uri, options);
      console.log(`[MongoDB] Connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    } catch (error) {
      console.error(`[MongoDB] Connection attempt failed: ${error.message}`);
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed gracefully.');
    }
  }

  getConnectionState() {
    const readyState = mongoose.connection.readyState;
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };
    return {
      state: readyState,
      status: states[readyState] || 'Unknown',
    };
  }
}

export const database = new Database();
export const connectDB = () => database.connect();
export default database;
