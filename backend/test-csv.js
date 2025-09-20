const ForexDataService = require('./services/ForexDataService');

async function testCSVIntegration() {
  console.log('🔄 Testing CSV Integration...\n');
  
  const dataService = new ForexDataService();
  
  try {
    console.log('1. Testing CSV file loading...');
    const data = await dataService.getHistoricalData('USD/EUR', 10);
    
    console.log(`✅ Successfully loaded ${data.length} records`);
    
    if (data.length > 0) {
      console.log('\n📊 Sample data from CSV:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Test different currency pairs
      console.log('\n2. Testing different currency pairs...');
      const pairs = ['GBP/USD', 'JPY/USD', 'EUR/GBP'];
      
      for (const pair of pairs) {
        const pairData = await dataService.getHistoricalData(pair, 5);
        console.log(`   ${pair}: ${pairData.length} records`);
      }
    }
    
    console.log('\n✅ CSV Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ CSV Integration test failed:', error);
  }
}

testCSVIntegration();
