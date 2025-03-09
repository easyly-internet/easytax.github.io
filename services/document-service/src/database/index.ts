import mongoose from 'mongoose';


/**
 * Connect to MongoDB database
 */
export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/taxsahihai-documents';
    
    await mongoose.connect(mongoUri, {
      // These options are recommended for modern MongoDB drivers
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.info(`Connected to MongoDB at ${mongoUri}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    // Exit the process if database connection fails
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.info('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB', error);
  }
};

// Optional: Handle connection events
mongoose.connection.on('connected', () => {
  console.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.info('Mongoose disconnected');
});

export default {
  connectDatabase,
  disconnectDatabase
};