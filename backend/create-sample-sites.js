// Create sample sites for testing
const sampleSites = [
  { site_id: 'JKTB001', site_name: 'PANYAKALAN', region: 'Jakarta', city: 'Jakarta' },
  { site_id: 'JKTB002', site_name: 'KEMAYORAN', region: 'Jakarta', city: 'Jakarta' },
  { site_id: 'JKTB003', site_name: 'THAMRIN', region: 'Jakarta', city: 'Jakarta' },
  { site_id: 'SUMRI001', site_name: 'MEDAN PLAZA', region: 'Sumatra', city: 'Medan' },
  { site_id: 'SUMRI002', site_name: 'PALEMBANG CENTER', region: 'Sumatra', city: 'Palembang' },
  { site_id: 'KALSEL001', site_name: 'BANJARMASIN', region: 'Kalimantan', city: 'Banjarmasin' }
];

// Mock sites API endpoint for testing
const mockSitesAPI = (req, res) => {
  console.log('Mock sites API called');
  res.json(sampleSites);
};

module.exports = { sampleSites, mockSitesAPI };