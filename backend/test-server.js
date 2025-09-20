const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 5001; // Use different port for testing

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
