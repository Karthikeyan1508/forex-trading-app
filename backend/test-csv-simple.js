// Simple CSV test
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'dataset.csv');

console.log('🔍 Testing CSV file access...');
console.log('CSV Path:', csvPath);
console.log('File exists:', fs.existsSync(csvPath));

if (fs.existsSync(csvPath)) {
  const stats = fs.statSync(csvPath);
  console.log('File size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  // Read first 5 records
  console.log('\n📊 Reading first 5 records...');
  let count = 0;
  
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (count < 5) {
        console.log(`Record ${count + 1}:`, {
          Date: row['Date'],
          CurrencyPair: row['Currency pair'],
          Close: row['Close'],
          RSI: row['RSI14'],
          BBandUpper: row['BBand_Upper']
        });
        count++;
      } else {
        process.exit(0); // Exit after 5 records
      }
    })
    .on('error', (error) => {
      console.error('❌ CSV Error:', error);
    })
    .on('end', () => {
      console.log('✅ CSV test completed');
    });
} else {
  console.log('❌ CSV file not found');
}
