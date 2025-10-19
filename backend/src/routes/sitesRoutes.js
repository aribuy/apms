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

// Check for duplicate sites
router.post('/check-duplicates', async (req, res) => {
  const { sites } = req.body;
  
  if (!sites || !Array.isArray(sites)) {
    return res.status(400).json({ error: 'Sites array is required' });
  }
  
  try {
    const siteIds = sites.map(site => site.siteId);
    const existingSites = await prisma.sites.findMany({
      where: {
        site_id: { in: siteIds }
      }
    });
    
    const duplicateIds = existingSites.map(site => site.site_id);
    const duplicateSites = sites.filter(site => duplicateIds.includes(site.siteId));
    
    res.json({
      duplicates: duplicateSites.length,
      duplicateList: duplicateSites,
      existingData: existingSites
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// Update existing sites (bulk)
router.put('/update-bulk', async (req, res) => {
  const { sites } = req.body;
  
  try {
    let updatedCount = 0;
    
    for (const site of sites) {
      await prisma.sites.updateMany({
        where: { site_id: site.siteId },
        data: {
          site_name: site.siteName,
          region: site.region,
          city: site.city,
          updated_at: new Date()
        }
      });
      updatedCount++;
    }
    
    res.json({ 
      message: `${updatedCount} sites updated successfully`,
      updated: updatedCount
    });
  } catch (error) {
    console.error('Error updating sites:', error);
    res.status(500).json({ error: 'Failed to update sites' });
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
        scope: site.siteType || 'MW',
        atp_required: true,
        atp_type: 'BOTH',
        workflow_stage: 'REGISTERED',
        region: site.region,
        city: site.city,
        ne_latitude: site.neLatitude,
        ne_longitude: site.neLongitude,
        fe_latitude: site.feLatitude,
        fe_longitude: site.feLongitude,
        status: site.status || 'ACTIVE'
      })),
      skipDuplicates: true
    });
    
    res.json({ 
      message: `${createdSites.count} sites created successfully`,
      created: createdSites.count
    });
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