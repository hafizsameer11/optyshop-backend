#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function emergencyFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 Emergency Banner Column Fix...');
    
    // Read and execute the SQL fix
    const sqlPath = path.join(__dirname, 'fix-banner-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing banner column fix...');
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Banner columns added successfully');
    
    // Regenerate Prisma Client
    console.log('🔄 Regenerating Prisma Client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✅ Prisma Client regenerated');
    console.log('🎯 Fix completed! Please restart the server.');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Banner columns already exist');
    } else {
      console.error('❌ Error applying fix:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

emergencyFix();
