const dotenv = require('dotenv')
const fs = require('fs');
const vars = ['BOT_TOKEN', 'CLIENT_ID', 'DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD']


// Check if we have a .env file
if (fs.existsSync('.env')) {
    // Load .env file
    dotenv.config();
} else {
    // Stop the app
    console.log('No .env file found. Working with environment variables...');
    console.log('Checking for required variables...');
    vars.forEach(variable => {
        if(!process.env[variable]) {
            console.log(`Variable "${variable}" not found! Please make sure to add it.`);
            process.exit(1);
        }
    });

    process.env.DB_PORT = process.env.DB_PORT || 5432;
}
