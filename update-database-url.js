const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(__dirname, '.env');

// Read current .env file
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.error('❌ .env file not found! Run npm run setup-env first.');
  process.exit(1);
}

console.log('📝 Database URL Configuration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Current DATABASE_URL format: mysql://user:password@host:port/database');
console.log('');

rl.question('MySQL Username (default: root): ', (username) => {
  username = username.trim() || 'root';
  
  rl.question('MySQL Password (press Enter if no password): ', (password) => {
    password = password.trim();
    
    rl.question('MySQL Host (default: localhost): ', (host) => {
      host = host.trim() || 'localhost';
      
      rl.question('MySQL Port (default: 3306): ', (port) => {
        port = port.trim() || '3306';
        
        rl.question('Database Name (default: optyshop): ', (database) => {
          database = database.trim() || 'optyshop';
          
          // Build DATABASE_URL
          let databaseUrl;
          if (password) {
            // URL encode password to handle special characters
            const encodedPassword = encodeURIComponent(password);
            databaseUrl = `mysql://${username}:${encodedPassword}@${host}:${port}/${database}`;
          } else {
            databaseUrl = `mysql://${username}@${host}:${port}/${database}`;
          }
          
          // Update .env file
          const updatedContent = envContent.replace(
            /DATABASE_URL=.*/,
            `DATABASE_URL=${databaseUrl}`
          );
          
          fs.writeFileSync(envPath, updatedContent, 'utf8');
          
          console.log('');
          console.log('✅ DATABASE_URL updated successfully!');
          console.log('');
          console.log('New DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
          console.log('');
          console.log('📝 Next steps:');
          console.log('   1. Make sure MySQL is running');
          console.log('   2. Create the database if it doesn\'t exist:');
          console.log(`      CREATE DATABASE ${database};`);
          console.log('   3. Test connection: npm run prisma:migrate');
          console.log('');
          
          rl.close();
        });
      });
    });
  });
});

