const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedATPTemplates() {
  console.log('🚀 Seeding ATP Templates from AVIAT documents...');

  // 1. Hardware Template
  const hwTemplate = await prisma.atp_document_templates.create({
    data: {
      template_code: 'TPL-HW-AVIAT-001',
      template_name: 'ATP MW Hardware v1.0',
      category: 'hardware',
      version: '1.0',
      scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'],
      form_schema: {},
      workflow_config: {},
      created_by: 'system'
    }
  });

  // Hardware Sections
  const hwSections = [
    { name: 'Site Information', items: [
      { desc: 'Site access road condition acceptable', severity: 'minor', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Site power supply stable and adequate', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Site security measures in place', severity: 'minor', evidence: 'photo', scope: ['MW-NEW'] }
    ]},
    { name: 'NE Microwave Acceptance Test', items: [
      // Site Cleaning
      { desc: 'Site to be clean and tidy inside cabinet and area', severity: 'minor', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      // Cables Installation
      { desc: 'Power Cable connected properly to IDU/POE, ODU, BLVD Rectifier', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Coax Cable connected properly waterproof to IDU and ODU', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Optic Cable connected properly to IDU/POE, ODU and BBU', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Ethernet Cable connected properly to IDU/POE, ODU and BBU', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Optic & Ethernet cable installed with conduit and tray ≥1 m above', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      { desc: 'Waveguide Cable connected waterproof to ODU and Antenna', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Grounding Kit properly connected waterproof to power/ethernet cable', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Grounding Cable connected to all busbar, IDU/POE, ODU', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'IDU Grounding properly to IGB busbar', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'ODU Grounding properly to nearest busbar', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Cable laying properly with clamps every 1 m', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      { desc: 'Excess optic cable properly tied at 5 m height', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      // IDU/POE Installation
      { desc: 'IDU Brand and Type verified', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      { desc: 'IDU Body & Port undamaged', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      { desc: 'IDU properly installed on rack/cabinet per BOQ/Design', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'IDU idle port covered properly', severity: 'minor', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      // ODU Installation
      { desc: 'ODU Brand and Type verified', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      { desc: 'ODU Body & Port undamaged', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      { desc: 'ODU properly installed with double nut on bracket', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'ODU idle port covered properly', severity: 'minor', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG', 'MW-RPL'] },
      { desc: 'Arrester installed on coax/ethernet cable', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      // MW Antenna Installation
      { desc: 'MW Antenna Brand & Type verified', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'MW Antenna Diameter measured', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      { desc: 'MW Antenna Height recorded', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      { desc: 'MW Antenna Azimuth verified', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Antenna Polarization verified', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Antenna installed properly (double nut bracket)', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'Antenna Stopper installed (>0.9 m)', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      { desc: 'Antenna Fix Strut installed (1–2 pcs depending on diameter)', severity: 'major', evidence: 'photo', scope: ['MW-NEW'] },
      // ISR Status
      { desc: 'ISR Number released', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Frequency matches ISR', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Bandwidth matches ISR', severity: 'critical', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Site Coordinates same as ISR', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW'] },
      // Microwave Alarm & Performance
      { desc: 'All MW Alarm cleared', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW License not demo version', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'RX Level (RSL) within ±3 dBm Link Budget', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'TX Level within Link Budget', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Interference ≤ –85 dBm', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'NMS Microwave Visibility proper', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Bandwidth = ISR', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'MW Capacity = Design Pack', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Protection Config = Design Pack', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Protection Switching Test normal', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'MW Aggregate Performance Test = 0 error', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'ODU Loopback Test within spec', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Ground–Neutral Voltage < 5 V', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'ODU Voltage ≥ 48 V DC', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] }
    ]},
    { name: 'FE Microwave Acceptance Test', items: [
      // Duplicate NE items with FE prefix
      { desc: 'FE Site to be clean and tidy inside cabinet and area', severity: 'minor', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'FE Power Cable connected properly to IDU/POE, ODU, BLVD Rectifier', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'FE Coax Cable connected properly waterproof to IDU and ODU', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'FE IDU properly installed on rack/cabinet per BOQ/Design', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'FE ODU properly installed with double nut on bracket', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'FE MW Antenna installed properly (double nut bracket)', severity: 'critical', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'FE All MW Alarm cleared', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'FE RX Level (RSL) within ±3 dBm Link Budget', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'FE ODU Voltage ≥ 48 V DC', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-UPG'] }
    ]},
    { name: 'Asset Tagging', items: [
      { desc: 'Main Antenna MW label/tag complete', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'Diversity Antenna MW label/tag complete (if any)', severity: 'major', evidence: 'photo', scope: ['MW-NEW', 'MW-RPL'] },
      { desc: 'NIMS Database entry completed (antenna data table)', severity: 'major', evidence: 'screenshot', scope: ['MW-NEW', 'MW-RPL'] }
    ]},
    { name: 'Document Attachments', items: [
      { desc: 'Link Budget attached & verified', severity: 'major', evidence: 'document', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'Bill of Quantity (BoQ) SAP & Non-SAP verified', severity: 'major', evidence: 'document', scope: ['MW-NEW', 'MW-UPG'] },
      { desc: 'CAF Document verified if applicable', severity: 'minor', evidence: 'document', scope: ['MW-NEW'] },
      { desc: 'ISR Document frequency & config aligned', severity: 'critical', evidence: 'screenshot', scope: ['MW-NEW', 'MW-UPG'] }
    ]}
  ];

  // Create hardware sections and items
  for (let i = 0; i < hwSections.length; i++) {
    const section = hwSections[i];
    const createdSection = await prisma.atp_template_sections.create({
      data: {
        template_id: hwTemplate.id,
        section_name: section.name,
        section_order: i + 1
      }
    });

    for (let j = 0; j < section.items.length; j++) {
      const item = section.items[j];
      await prisma.atp_template_items.create({
        data: {
          section_id: createdSection.id,
          description: item.desc,
          severity: item.severity,
          evidence_type: item.evidence,
          scope: item.scope,
          item_order: j + 1,
          status: 'active'
        }
      });
    }
  }

  // 2. Software Template
  const swTemplate = await prisma.atp_document_templates.create({
    data: {
      template_code: 'TPL-SW-AVIAT-001',
      template_name: 'ATP MW Software v1.0',
      category: 'software',
      version: '1.0',
      scope: ['MW-UPG', 'MW-SW'],
      form_schema: {},
      workflow_config: {},
      created_by: 'system'
    }
  });

  // Software Sections
  const swSections = [
    { name: 'Equipment Inventory Information', items: [
      { desc: 'Validate equipment serial number before/after upgrade', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Confirm license file (.key) installed', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Confirm ODU card name and sub-band match license', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] }
    ]},
    { name: 'S/W License Inventory Information', items: [
      { desc: 'Check installed license list matches BoQ', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Verify capacity license (e.g., 50 MB → 400 MB) active', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Verify modulation license (1024QAM/2048QAM) active', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Verify redundancy 1+1 license enabled', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Verify LAG/LACP and ETH aggregation license active', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] }
    ]},
    { name: 'Radio Configuration', items: [
      { desc: 'Compare "Before" vs "After" configuration', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Confirm bandwidth changed (e.g., 28 MHz → 56 MHz)', severity: 'critical', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Verify frequency and polarization unchanged', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG'] },
      { desc: 'Verify ODU board name & IP configured', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] }
    ]},
    { name: 'Metering', items: [
      { desc: 'Validate TX/RX power levels', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Validate MSE values (-35 ~ -50 dB)', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] }
    ]},
    { name: 'ODU Verification', items: [
      { desc: 'Verify ODU serial number', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Confirm ODU voltage > 48 V', severity: 'major', evidence: 'photo', scope: ['MW-UPG', 'MW-SW'] },
      { desc: 'Verify software version post-upgrade', severity: 'major', evidence: 'screenshot', scope: ['MW-UPG', 'MW-SW'] }
    ]}
  ];

  // Create software sections and items
  for (let i = 0; i < swSections.length; i++) {
    const section = swSections[i];
    const createdSection = await prisma.atp_template_sections.create({
      data: {
        template_id: swTemplate.id,
        section_name: section.name,
        section_order: i + 1
      }
    });

    for (let j = 0; j < section.items.length; j++) {
      const item = section.items[j];
      await prisma.atp_template_items.create({
        data: {
          section_id: createdSection.id,
          description: item.desc,
          severity: item.severity,
          evidence_type: item.evidence,
          scope: item.scope,
          item_order: j + 1,
          status: 'active'
        }
      });
    }
  }

  console.log('✅ ATP Templates seeded successfully!');
  console.log(`📋 Hardware Template: ${hwTemplate.template_code} (${hwSections.reduce((acc, s) => acc + s.items.length, 0)} items)`);
  console.log(`💻 Software Template: ${swTemplate.template_code} (${swSections.reduce((acc, s) => acc + s.items.length, 0)} items)`);
}

seedATPTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());