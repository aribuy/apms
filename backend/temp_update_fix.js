// Update project - Dynamic field updating
router.put('/:id', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    const allowedFields = ['name', 'description', 'executionType', 'status', 'startDate', 'endDate', 'workgroupId', 'customerRef', 'poNumber', 'budget'];
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    // Build dynamic query based on provided fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const dbField = field === 'executionType' || field === 'startDate' || field === 'endDate' || field === 'workgroupId' || field === 'customerRef' || field === 'poNumber' ? `"${field}"` : field;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    // Add updatedAt timestamp
    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`);
    
    // Add the ID parameter
    values.push(req.params.id);
    
    const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    await client.connect();
    const result = await client.query(query, values);
    await client.end();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
