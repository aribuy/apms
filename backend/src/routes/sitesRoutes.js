const express = require('express');
const router = express.Router();

// Use the same Prisma instance from server.js
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  console.log('Prisma client initialized in sitesRoutes');
} catch (error) {
  console.error('Error initializing Prisma:', error);
}

// Get all sites
router.get('/', async (req, res) => {
  try {
    console.log('Fetching sites from database...');
    const sites = await prisma.sites.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log('Found sites:', sites.length);
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites', details: error.message });
  }
});

// Create multiple sites (bulk)
router.post('/bulk', async (req, res) => {
  const { sites } = req.body;
  
  if (!sites || !Array.isArray(sites)) {
    return res.status(400).json({ error: 'Sites array is required' });
  }
  
  try {
    const createdSites = await prisma.sites.createMany({
      data: sites.map(site => ({
        id: require('crypto').randomUUID(),
        site_id: site.siteId,
        site_name: site.siteName,
        site_type: site.siteType || 'MW',
        region: site.region,
        city: site.city,
        ne_latitude: site.neLatitude,
        ne_longitude: site.neLongitude,
        fe_latitude: site.feLatitude,
        fe_longitude: site.feLongitude,
        status: site.status || 'ACTIVE'
      }))
    });
    
    res.json({ message: `${sites.length} sites created successfully` });
  } catch (error) {
    console.error('Error creating sites:', error);
    res.status(500).json({ error: 'Failed to create sites' });
  }
});

// Update site
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const updatedSite = await prisma.sites.update({
      where: { id },
      data: { ...req.body, updated_at: new Date() }
    });
    
    res.json({ message: 'Site updated successfully', site: updatedSite });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Delete site
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await prisma.sites.delete({
      where: { id }
    });
    
    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

module.exports = router;