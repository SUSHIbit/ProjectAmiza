const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('========================================');
console.log('Secure Discord Chat - Deployment Helper');
console.log('========================================');
console.log('\nThis script will help you prepare for deployment.');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('\nCreating .env file from template...');
  
  if (fs.existsSync('env.template')) {
    fs.copyFileSync('env.template', '.env');
    console.log('✅ .env file created successfully.');
  } else {
    console.log('❌ env.template not found. Please create a .env file manually.');
  }
}

// Function to update the .env file with user input
function updateEnvFile() {
  rl.question('\nEnter your Discord Bot Token: ', (botToken) => {
    if (botToken.trim() === '') {
      console.log('❌ Discord Bot Token is required for the application to function.');
      return updateEnvFile();
    }
    
    rl.question('\nEnter the encryption key to be shared with all users: ', (encryptionKey) => {
      if (encryptionKey.trim() === '') {
        console.log('❌ Encryption key is required for the application to function.');
        return updateEnvFile();
      }
      
      let envContent = fs.readFileSync('.env', 'utf8');
      
      // Update the values in the .env file
      envContent = envContent.replace(/DISCORD_BOT_TOKEN=.*/, `DISCORD_BOT_TOKEN=${botToken}`);
      envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${encryptionKey}`);
      
      fs.writeFileSync('.env', envContent);
      
      console.log('\n✅ .env file updated successfully with your values.');
      
      rl.question('\nWould you like to deploy to a hosting platform? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log(`
Deployment Options:
1. Render (https://render.com) - Free tier available
2. Railway (https://railway.app) - Free tier with limits
3. Heroku (https://heroku.com) - Paid service

Follow these steps for deployment:
1. Create an account on your chosen platform
2. Connect your GitHub repository or upload your code
3. Set the following environment variables:
   - DISCORD_BOT_TOKEN
   - ENCRYPTION_KEY
4. Set the build command to: npm install
5. Set the start command to: npm start
          `);
        }
        
        console.log('\n✅ Your project is now ready for deployment!');
        console.log('\nReminder: Share these details with your friends:');
        console.log('1. The URL of your deployed app');
        console.log('2. The shared encryption key you set');
        console.log('3. Instructions to find their Discord User ID');
        
        rl.close();
      });
    });
  });
}

updateEnvFile(); 