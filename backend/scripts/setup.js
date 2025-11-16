const { spawn } = require('child_process');
const path = require('path');

const scripts = [
    'createAdmin.js',
    'addSampleProducts.js',
    'addSampleUsers.js',
    'addSampleOrders.js',
    'addSampleReviews.js'
];

const scriptsDir = __dirname;

console.log('🚀 Starting LappyShoppy Setup...\n');
console.log('==========================================');
console.log('Scripts to run:');
scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script}`);
});
console.log('==========================================\n');

let currentScriptIndex = 0;

function runNextScript() {
    if (currentScriptIndex >= scripts.length) {
        console.log('\n🎉 All setup scripts completed successfully!');
        console.log('\n📋 Setup Summary:');
        console.log('✅ Admin user created');
        console.log('✅ Sample products added');
        console.log('✅ Sample users created');
        console.log('✅ Sample orders generated');
        console.log('✅ Sample reviews added');
        console.log('\n💡 Next steps:');
        console.log('1. Start backend: cd backend && npm run dev');
        console.log('2. Start frontend: cd frontend && npm run dev');
        console.log('3. Login as admin: admin@lappyshoppy.com / admin123');
        process.exit(0);
    }

    const scriptName = scripts[currentScriptIndex];
    const scriptPath = path.join(scriptsDir, scriptName);

    console.log(`\n▶️  Running script ${currentScriptIndex + 1}/${scripts.length}: ${scriptName}`);
    console.log('==========================================');

    const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: scriptsDir
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ ${scriptName} completed successfully\n`);
            currentScriptIndex++;
            runNextScript();
        } else {
            console.error(`❌ ${scriptName} failed with exit code ${code}`);
            console.error('\n🔄 Setup stopped due to error.');
            console.error('Please fix the issue and run the setup script again.');
            process.exit(1);
        }
    });

    child.on('error', (error) => {
        console.error(`❌ Error running ${scriptName}:`, error.message);
        console.error('\n🔄 Setup stopped due to error.');
        console.error('Please fix the issue and run the setup script again.');
        process.exit(1);
    });
}

// Start the setup process
runNextScript();