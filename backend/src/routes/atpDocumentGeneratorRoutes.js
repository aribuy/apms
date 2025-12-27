const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/excel/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

// ATP Checklist Template (default items)
const DEFAULT_CHECKLIST = [
  { category: 'Hardware Installation', items: [
    'ODU Installation and Alignment',
    'IDU Installation and Connection',
    'Power Supply Connection',
    'Grounding System Check'
  ]},
  { category: 'Software Configuration', items: [
    'License Installation',
    'Bandwidth Configuration', 
    'Modulation Settings',
    'Network Parameters'
  ]},
  { category: 'Performance Test', items: [
    'Link Quality Test',
    'Throughput Test',
    'Latency Test',
    'Error Rate Test'
  ]}
];

// Generate ATP Document
router.post('/generate', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file required' });
    }

    // Read file (CSV or Excel)
    let atpData = [];
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExt === '.csv') {
      const csvData = fs.readFileSync(req.file.path, 'utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const row = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
          });
          atpData.push(row);
        }
      }
    } else {
      const workbook = XLSX.readFile(req.file.path);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      atpData = XLSX.utils.sheet_to_json(worksheet);
    }

    // Extract ATP information
    const atpInfo = {
      projectCode: atpData[0]?.Project_Code || 'XLS-MW-2024-001',
      linkId: atpData[0]?.Link_ID || '',
      linkName: atpData[0]?.Link_Name || 'XLSmart MW ATP',
      siteIdNE: atpData[0]?.Site_ID_NE || '',
      siteNameNE: atpData[0]?.Site_Name_NE || '',
      siteIdFE: atpData[0]?.Site_ID_FE || '',
      siteNameFE: atpData[0]?.Site_Name_FE || '',
      region: atpData[0]?.Region || '',
      sow: atpData[0]?.SOW || 'MW',
      vendor: atpData[0]?.Vendor || '',
      testDate: atpData[0]?.Test_Date || new Date().toISOString().split('T')[0],
      engineer: atpData[0]?.Engineer || '',
      frequency: atpData[0]?.Frequency || '',
      bandwidth: atpData[0]?.Bandwidth || '',
      modulation: atpData[0]?.Modulation || '',
      licenses: []
    };

    // Generate PDF
    const pdfPath = await generateATPPDF(atpInfo);
    
    // Send PDF file
    res.download(pdfPath, `ATP_${atpInfo.siteIdNE}_${atpInfo.siteIdFE}.pdf`, (err) => {
      if (err) console.error(err);
      // Cleanup files
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    console.error('ATP generation error:', error);
    res.status(500).json({ error: 'Failed to generate ATP document' });
  }
});

// Generate Excel template
router.get('/template', (req, res) => {
  try {
    const csvContent = `Project_Code,Link_ID,Link_Name,Site_ID_NE,Site_Name_NE,Site_ID_FE,Site_Name_FE,Region,SOW,Vendor,Test_Date,Engineer,Frequency,Bandwidth,Modulation
XLS-MW-2024-001,KAL-KB-SBS-0730/KAL-KB-SBS-0389,XLSmart MW ATP,KAL-KB-SBS-0730,Kalibata SBS Tower,KAL-KB-SBS-0389,Kalibata SBS Remote,Jakarta,MW,ZTE,2024-01-15,Ahmad Qonik Mubarok,18 GHz,56 MHz,2048QAM`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ATP_Template.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Generate PDF function
async function generateATPPDF(atpInfo) {
  const doc = new PDFDocument();
  const pdfPath = path.join('uploads', `ATP_${Date.now()}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Header
  doc.fontSize(16).font('Helvetica-Bold')
     .text(atpInfo.linkName, 50, 50);
  
  doc.fontSize(12).font('Helvetica')
     .text(`${atpInfo.siteIdNE} - ${atpInfo.siteIdFE}`, 50, 80);

  // Project Information
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Project Information', 50, 120);
  
  doc.fontSize(10).font('Helvetica')
     .text(`Project Code: ${atpInfo.projectCode}`, 50, 145)
     .text(`Link ID: ${atpInfo.linkId}`, 50, 160)
     .text(`Region: ${atpInfo.region}`, 50, 175)
     .text(`SOW: ${atpInfo.sow}`, 50, 190)
     .text(`Vendor: ${atpInfo.vendor}`, 50, 205);

  // Site Information
  doc.fontSize(14).font('Helvetica-Bold')
     .text('Site Information', 50, 240);
  
  doc.fontSize(10).font('Helvetica')
     .text(`NE Site: ${atpInfo.siteIdNE} - ${atpInfo.siteNameNE}`, 50, 265)
     .text(`FE Site: ${atpInfo.siteIdFE} - ${atpInfo.siteNameFE}`, 50, 280)
     .text(`Frequency: ${atpInfo.frequency}`, 50, 295)
     .text(`Bandwidth: ${atpInfo.bandwidth}`, 50, 310)
     .text(`Modulation: ${atpInfo.modulation}`, 50, 325)
     .text(`Test Date: ${atpInfo.testDate}`, 50, 340)
     .text(`Engineer: ${atpInfo.engineer}`, 50, 355);

  // License Information
  let yPos = 380;
  if (atpInfo.licenses && atpInfo.licenses.length > 0) {
    doc.fontSize(14).font('Helvetica-Bold')
       .text('License Information', 50, yPos);
    yPos += 25;
    
    atpInfo.licenses.forEach((license, index) => {
      doc.fontSize(11).font('Helvetica-Bold')
         .text(`License ${index + 1} (${license.Site} Site):`, 50, yPos);
      yPos += 15;
      
      doc.fontSize(9).font('Helvetica')
         .text(`Description: ${license.Description}`, 70, yPos)
         .text(`License File: ${license.License_File}`, 70, yPos + 12)
         .text(`Serial Number: ${license.Serial_Number}`, 70, yPos + 24)
         .text(`Parameter: ${license.Parameter}`, 70, yPos + 36)
         .text(`PIC: ${license.PIC}`, 70, yPos + 48);
      yPos += 70;
    });
    yPos += 10;
  }

  // Checklist
  doc.fontSize(14).font('Helvetica-Bold')
     .text('ATP Checklist', 50, yPos);
  
  yPos += 30;
  DEFAULT_CHECKLIST.forEach(category => {
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
    
    doc.fontSize(12).font('Helvetica-Bold')
       .text(category.category, 50, yPos);
    yPos += 20;
    
    category.items.forEach(item => {
      if (yPos > 720) {
        doc.addPage();
        yPos = 50;
      }
      doc.fontSize(10).font('Helvetica')
         .text('☐', 70, yPos)
         .text(item, 90, yPos);
      yPos += 15;
    });
    yPos += 10;
  });

  // Signature section
  if (yPos > 650) {
    doc.addPage();
    yPos = 50;
  } else {
    yPos += 30;
  }
  
  doc.fontSize(12).font('Helvetica-Bold')
     .text('Acceptance & Approval', 50, yPos);
  
  yPos += 30;
  doc.fontSize(10).font('Helvetica')
     .text('Field Engineer: ________________________', 50, yPos)
     .text('Date: ____________', 350, yPos);
  
  yPos += 40;
  doc.text('Site Manager: ________________________', 50, yPos)
     .text('Date: ____________', 350, yPos);
     
  yPos += 40;
  doc.text('ATP Approved By: ________________________', 50, yPos)
     .text('Date: ____________', 350, yPos);

  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => resolve(pdfPath));
  });
}

module.exports = router;