/**
 * Test script for Job Application submission endpoint
 * Run with: node test-job-application.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const testPayload = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "+33 1 23 45 67 89",
  linkedInProfile: "https://linkedin.com/in/johndoe",
  portfolioWebsite: "https://johndoe.com",
  resumeCv: "https://example.com/resume.pdf",
  coverLetterFile: "https://example.com/cover-letter.pdf",
  whyJoinMessage: "I am passionate about optical technology and would love to join Fittingbox. I have extensive experience in digital commerce and product management...",
  jobId: 102
};

async function testJobApplication() {
  try {
    console.log('Testing Job Application Submission...');
    console.log('Endpoint:', `${BASE_URL}/api/forms/job-application/submissions`);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    console.log('\n');

    const response = await fetch(`${BASE_URL}/api/forms/job-application/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Test passed! Job application submitted successfully.');
    } else {
      console.log('\n❌ Test failed!');
      if (data.data && data.data.receivedFields) {
        console.log('Received fields:', data.data.receivedFields);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testJobApplication();

