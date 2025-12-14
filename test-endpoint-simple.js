/**
 * Simple test to verify the job application endpoint
 * This will help diagnose the empty body issue
 */

const http = require('http');

const testData = JSON.stringify({
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+33 1 23 45 67 89",
  linkedInProfile: "https://linkedin.com/in/johndoe",
  portfolioWebsite: "https://johndoe.com",
  resumeCv: "https://example.com/resume.pdf",
  coverLetterFile: "https://example.com/cover-letter.pdf",
  whyJoinMessage: "I am passionate about optical technology and would love to join Fittingbox.",
  jobId: 102
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/forms/job-application/submissions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('Testing endpoint:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Sending data:', testData);
console.log('\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  console.log('\n');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.error('\nMake sure the server is running on port 5000');
});

req.write(testData);
req.end();

