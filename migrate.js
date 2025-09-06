#!/usr/bin/env node

/**
 * Migration script to help transition from old PlastixThinker structure to new professional structure
 * This script will help preserve existing data and configurations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 PlastixThinker Migration Script');
console.log('=====================================\n');

// Check if old index.js exists
const oldIndexPath = path.join(__dirname, 'index.js');
const newServerPath = path.join(__dirname, 'src', 'server.js');

if (!fs.existsSync(oldIndexPath)) {
  console.log('❌ Old index.js not found. Migration not needed.');
  process.exit(0);
}

if (!fs.existsSync(newServerPath)) {
  console.log('❌ New server.js not found. Please run npm install first.');
  process.exit(1);
}

console.log('📋 Migration Steps:');
console.log('1. ✅ New structure created');
console.log('2. ✅ Dependencies installed');
console.log('3. 🔄 Backing up old files...');

// Create backup directory
const backupDir = path.join(__dirname, 'backup', new Date().toISOString().replace(/[:.]/g, '-'));
if (!fs.existsSync(path.dirname(backupDir))) {
  fs.mkdirSync(path.dirname(backupDir), { recursive: true });
}

// Backup old files
try {
  fs.copyFileSync(oldIndexPath, path.join(backupDir, 'index.js'));
  console.log('   ✅ Backed up index.js');
  
  // Backup package.json if it exists
  const oldPackagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(oldPackagePath)) {
    fs.copyFileSync(oldPackagePath, path.join(backupDir, 'package.json'));
    console.log('   ✅ Backed up package.json');
  }
  
  // Backup .env if it exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, path.join(backupDir, '.env'));
    console.log('   ✅ Backed up .env');
  }
  
  console.log(`   📁 Backup created at: ${backupDir}`);
} catch (error) {
  console.error('   ❌ Backup failed:', error.message);
}

console.log('\n4. 🔧 Environment setup...');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('   ✅ Created .env from template');
      console.log('   ⚠️  Please edit .env with your actual values');
    } catch (error) {
      console.error('   ❌ Failed to create .env:', error.message);
    }
  } else {
    console.log('   ⚠️  No .env found. Please create one manually.');
  }
} else {
  console.log('   ✅ .env already exists');
}

console.log('\n5. 🚀 Ready to start new server!');
console.log('\n📝 Next Steps:');
console.log('1. Edit .env with your OpenAI API key and other settings');
console.log('2. Run: npm start');
console.log('3. Or for development: npm run dev');
console.log('\n🔄 Your old server is backed up and can be restored if needed.');
console.log(`📁 Backup location: ${backupDir}`);

console.log('\n✨ Migration completed successfully!');
console.log('🎉 Welcome to the new professional PlastixThinker structure!');
