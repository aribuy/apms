const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    const where = {};
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.is_active = status === 'active';
    if (search) {
      where.OR = [
        { template_name: { contains: search, mode: 'insensitive' } },
        { template_code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const templates = await prisma.atp_document_templates.findMany({
      where,
      include: {
        atp_template_sections: {
          include: {
            atp_template_items: true
          },
          orderBy: { section_order: 'asc' }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.atp_document_templates.findUnique({
      where: { id: req.params.id },
      include: {
        atp_template_sections: {
          include: {
            atp_template_items: {
              orderBy: { item_order: 'asc' }
            }
          },
          orderBy: { section_order: 'asc' }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Template detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', async (req, res) => {
  try {
    const { template_name, category, version, scope, sections } = req.body;
    
    // Generate template code
    const count = await prisma.atp_document_templates.count();
    const template_code = `TPL-${category.toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const template = await prisma.atp_document_templates.create({
      data: {
        template_code,
        template_name,
        category,
        version: version || '1.0',
        scope: scope || [],
        form_schema: {},
        workflow_config: {},
        created_by: 'current-user'
      }
    });

    // Create sections and items
    if (sections && sections.length > 0) {
      console.log('Creating sections:', sections);
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        console.log('Creating section:', section);
        const createdSection = await prisma.atp_template_sections.create({
          data: {
            template_id: template.id,
            section_name: section.section_name || `Section ${i + 1}`,
            section_order: i + 1,
            description: section.description || ''
          }
        });
        console.log('Created section:', createdSection);

        if (section.items && section.items.length > 0) {
          for (let j = 0; j < section.items.length; j++) {
            const item = section.items[j];
            await prisma.atp_template_items.create({
              data: {
                section_id: createdSection.id,
                description: item.description,
                severity: item.severity || 'minor',
                evidence_type: item.evidence_type || 'photo',
                scope: item.scope || [],
                instructions: item.instructions || '',
                reference_photo: item.reference_photo || null,
                item_order: j + 1
              }
            });
          }
        }
      }
    } else {
      console.log('No sections provided');
    }

    // Return template with sections and items
    const fullTemplate = await prisma.atp_document_templates.findUnique({
      where: { id: template.id },
      include: {
        atp_template_sections: {
          include: {
            atp_template_items: {
              orderBy: { item_order: 'asc' }
            }
          },
          orderBy: { section_order: 'asc' }
        }
      }
    });

    res.json({ success: true, data: fullTemplate });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    console.log('Update request for template:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { template_name, category, version, scope, sections, is_active } = req.body;

    // Update template basic info
    const templateUpdate = await prisma.atp_document_templates.update({
      where: { id: req.params.id },
      data: {
        template_name,
        category,
        version,
        scope,
        is_active,
        updated_at: new Date()
      }
    });
    console.log('Template updated:', templateUpdate);

    // Only update sections if sections are explicitly provided
    if (sections !== undefined && Array.isArray(sections)) {
      if (sections.length > 0) {
        // Delete existing sections and items
        await prisma.atp_template_sections.deleteMany({
          where: { template_id: req.params.id }
        });

        // Create new sections and items
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const createdSection = await prisma.atp_template_sections.create({
            data: {
              template_id: req.params.id,
              section_name: section.section_name,
              section_order: i + 1,
              description: section.description
            }
          });

          if (section.items && section.items.length > 0) {
            for (let j = 0; j < section.items.length; j++) {
              const item = section.items[j];
              await prisma.atp_template_items.create({
                data: {
                  section_id: createdSection.id,
                  description: item.description,
                  severity: item.severity || 'minor',
                  evidence_type: item.evidence_type || 'photo',
                  scope: item.scope || [],
                  instructions: item.instructions,
                  reference_photo: item.reference_photo || null,
                  item_order: j + 1
                }
              });
            }
          }
        }
      } else {
        // If empty array provided, delete all sections
        await prisma.atp_template_sections.deleteMany({
          where: { template_id: req.params.id }
        });
      }
    }
    // If sections is undefined, don't touch existing sections

    // Return updated template
    const updatedTemplate = await prisma.atp_document_templates.findUnique({
      where: { id: req.params.id },
      include: {
        atp_template_sections: {
          include: {
            atp_template_items: {
              orderBy: { item_order: 'asc' }
            }
          },
          orderBy: { section_order: 'asc' }
        }
      }
    });

    res.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    await prisma.atp_document_templates.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template deletion error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// Clone template
router.post('/:id/clone', async (req, res) => {
  try {
    const original = await prisma.atp_document_templates.findUnique({
      where: { id: req.params.id }
    });

    if (!original) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const count = await prisma.atp_document_templates.count();
    const template_code = `TPL-${original.category.toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const cloned = await prisma.atp_document_templates.create({
      data: {
        template_code,
        template_name: `${original.template_name} (Copy)`,
        category: original.category,
        version: '1.0',
        form_schema: original.form_schema,
        checklist_items: original.checklist_items,
        workflow_config: original.workflow_config,
        created_by: 'current-user'
      }
    });

    res.json({ success: true, data: cloned });
  } catch (error) {
    console.error('Template clone error:', error);
    res.status(500).json({ success: false, error: 'Failed to clone template' });
  }
});

// Update item photo
router.put('/:templateId/items/:itemId/photo', async (req, res) => {
  try {
    const { reference_photo } = req.body;
    
    await prisma.atp_template_items.update({
      where: { id: req.params.itemId },
      data: { reference_photo }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Photo update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update photo' });
  }
});

// Get template analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    // Mock analytics data for now
    const analytics = {
      usageCount: Math.floor(Math.random() * 50) + 1,
      completionRate: Math.floor(Math.random() * 30) + 70,
      avgCompletionTime: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)} hrs`,
      lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

module.exports = router;