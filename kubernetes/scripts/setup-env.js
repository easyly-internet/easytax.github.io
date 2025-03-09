/**
 * Setup environment script for non-Docker development
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create necessary directories
const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Create .env files for services
const createEnvFile = (servicePath, envVars) => {
  const envPath = path.join(servicePath, '.env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent);
  console.log(`Created .env file at: ${envPath}`);
};

// Setup for all services
const setupServices = () => {
  // Create scripts directory
  createDirectory(path.join(__dirname, '..', 'scripts'));

  // Auth Service
  createEnvFile(path.join(__dirname, '..', 'services', 'auth-service'), {
    NODE_ENV: 'development',
    PORT: 8081,
    MONGO_URI: 'mongodb://localhost:27017/taxsahihai-auth',
    JWT_SECRET: 'local_development_secret_key',
    JWT_EXPIRES_IN: '1d'
  });

  // Member Service
  createEnvFile(path.join(__dirname, '..', 'services', 'member-service'), {
    NODE_ENV: 'development',
    PORT: 8082,
    MONGO_URI: 'mongodb://localhost:27017/taxsahihai-members',
    AUTH_SERVICE_URL: 'http://localhost:8081'
  });

  // Document Service
  createDirectory(path.join(__dirname, '..', 'services', 'document-service', 'storage'));
  createEnvFile(path.join(__dirname, '..', 'services', 'document-service'), {
    NODE_ENV: 'development',
    PORT: 8083,
    MONGO_URI: 'mongodb://localhost:27017/taxsahihai-documents',
    AUTH_SERVICE_URL: 'http://localhost:8081',
    STORAGE_PATH: path.join(__dirname, '..', 'services', 'document-service', 'storage')
  });

  // AI Service
  createEnvFile(path.join(__dirname, '..', 'services', 'ai-service'), {
    NODE_ENV: 'development',
    PORT: 8084,
    MONGO_URI: 'mongodb://localhost:27017/taxsahihai-ai',
    AUTH_SERVICE_URL: 'http://localhost:8081',
    DOCUMENT_SERVICE_URL: 'http://localhost:8083',
    OPENAI_API_KEY: 'your_openai_api_key'
  });

  // Payment Service
  createEnvFile(path.join(__dirname, '..', 'services', 'payment-service'), {
    NODE_ENV: 'development',
    PORT: 8085,
    MONGO_URI: 'mongodb://localhost:27017/taxsahihai-payments',
    AUTH_SERVICE_URL: 'http://localhost:8081',
    STRIPE_SECRET_KEY: 'your_stripe_test_key',
    STRIPE_WEBHOOK_SECRET: 'your_stripe_webhook_secret'
  });

  // Frontend
  createEnvFile(path.join(__dirname, '..', 'frontend'), {
    REACT_APP_API_URL: 'http://localhost:8080'
  });

  console.log('\nEnvironment setup complete!');
  console.log('\nNext steps:');
  console.log('1. Install MongoDB locally if not already installed');
  console.log('2. Update API keys in the .env files with real values');
  console.log('3. Start the services with: yarn dev');
};

// Verify MongoDB is running or can be installed
try {
  console.log('Checking if MongoDB is available...');
  execSync('mongod --version', { stdio: 'ignore' });
  console.log('MongoDB is installed.');
} catch (error) {
  console.log('MongoDB is not installed or not in PATH.');
  console.log('Please install MongoDB before continuing:');
  console.log('- Ubuntu: sudo apt install -y mongodb');
  console.log('- macOS: brew install mongodb-community');
  console.log('- Windows: https://www.mongodb.com/try/download/community');
}

// Run setup
setupServices();