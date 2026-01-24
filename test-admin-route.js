const express = require('express');
const app = express();

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// Import and test the actual routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Test the route
  console.log('Testing admin product-gifts route...');
  
  // Make a simple request to test
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/admin/product-gifts',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response:', data);
      process.exit(0);
    });
  });
  
  req.on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
  
  req.end();
});
