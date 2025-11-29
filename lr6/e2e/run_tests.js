const BrokerTest = require('./selenium_test');

async function runAllTests() {
    console.log('🧪 Starting comprehensive broker E2E tests...\n');
    
    const test = new BrokerTest();
    
    try {
        await test.runTests();
        console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ TESTS FAILED:', error);
        process.exit(1);
    }
}

// Wait for servers to start
console.log('⏳ Waiting for servers to start...');
setTimeout(runAllTests, 10000);
