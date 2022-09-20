const dotenv = require('dotenv')
const fs = require('fs');

// Check if we have a .env file
if (fs.existsSync('.env')) {
    // Load .env file
    dotenv.config();
} else {
    // Stop the app
    console.log('No .env file found. Please create one.');
    process.exit(1);
}
