// Direct site creation without database
const express = require('express');
const app = express();

// Mock sites data
const mockSites = [
  {
    id: '1',
    site_id: 'JKTB001',
    site_name: 'PANYAKALAN',
    site_type: 'MW',
    region: 'Jakarta',
    city: 'Jakarta',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  },
  {
    id: '2', 
    site_id: 'JKTB002',
    site_name: 'KEMAYORAN',
    site_type: 'MW',
    region: 'Jakarta',
    city: 'Jakarta',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    site_id: 'SUMRI001', 
    site_name: 'MEDAN PLAZA',
    site_type: 'MW',
    region: 'Sumatra',
    city: 'Medan',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  }
];

// Create sites endpoint that bypasses database
app.use(express.json());

app.post('/api/v1/sites/mock-create', (req, res) => {
  console.log('Creating mock sites...');
  res.json({ 
    message: `${mockSites.length} sites created successfully`,
    sites: mockSites
  });
});

app.get('/api/v1/sites/mock', (req, res) => {
  console.log('Returning mock sites...');
  res.json(mockSites);
});

app.listen(3012, () => {
  console.log('Mock sites server running on port 3012');
  console.log('Available endpoints:');
  console.log('- POST /api/v1/sites/mock-create');
  console.log('- GET /api/v1/sites/mock');
});

module.exports = { mockSites };