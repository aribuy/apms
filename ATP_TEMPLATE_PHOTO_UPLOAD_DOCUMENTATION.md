# ATP Template Photo Upload System - Complete Documentation

## Overview
The ATP Template Photo Upload system allows users to upload reference photos for checklist items in ATP templates. This system includes photo upload, storage, display, and zoom functionality.

## System Architecture

### Database Schema
```sql
-- ATP Template Items table with reference photo support
model atp_template_items {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  section_id       String    @db.Uuid
  item_number      String?   @db.VarChar(20)
  description      String
  severity         String?   @default("minor") @db.VarChar(20)
  evidence_type    String?   @default("photo") @db.VarChar(50)
  scope            Json?     @default("[]")
  instructions     String?
  validation_rules String?
  reference_photo  String?   @db.VarChar(500)  -- NEW FIELD FOR PHOTO URL
  item_order       Int
  is_required      Boolean?  @default(true)
  created_at       DateTime? @default(now()) @db.Timestamp(6)
  updated_at       DateTime? @default(now()) @db.Timestamp(6)
  atp_template_sections atp_template_sections @relation(fields: [section_id], references: [id], onDelete: Cascade)
}
```

### File Storage Structure
```
backend/
├── uploads/
│   └── reference-photos/
│       ├── ref-1760667528772-153293996.jpeg
│       ├── ref-1760667610369-626792266.jpeg
│       └── ref-1760667706819-807811182.jpeg
└── server.js (serves static files via /uploads route)
```

## API Endpoints

### 1. Photo Upload Endpoint
```javascript
POST /api/v1/upload/reference-photo
Content-Type: multipart/form-data

// Request Body
FormData {
  photo: File (image file)
}

// Response
{
  "success": true,
  "data": {
    "filename": "ref-1760667528772-153293996.jpeg",
    "originalName": "photo.jpg",
    "url": "/uploads/reference-photos/ref-1760667528772-153293996.jpeg",
    "size": 325220
  }
}
```

### 2. Update Item Photo Endpoint
```javascript
PUT /api/v1/atp-templates/:templateId/items/:itemId/photo
Content-Type: application/json

// Request Body
{
  "reference_photo": "/uploads/reference-photos/ref-1760667528772-153293996.jpeg"
}

// Response
{
  "success": true
}
```

### 3. Template CRUD Endpoints
```javascript
// Get template with photos
GET /api/v1/atp-templates/:id
// Response includes reference_photo field in items

// Update template (preserves existing sections/photos)
PUT /api/v1/atp-templates/:id
// Only updates basic template info, preserves sections
```

## Frontend Components

### 1. TemplateBuilder Component
**Location**: `/frontend/src/components/ATPTemplateManagement/TemplateBuilder.tsx`

**Key Features**:
- Integrated photo upload area (click to upload)
- Photo preview with zoom functionality
- Immediate photo save to database
- Photo zoom modal with dark overlay

**Photo Upload Flow**:
```typescript
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number, itemIndex: number) => {
  // 1. Upload photo to server
  const formData = new FormData();
  formData.append('photo', file);
  
  // 2. Get photo URL from response
  const response = await fetch('http://localhost:3011/api/v1/upload/reference-photo', {
    method: 'POST',
    body: formData
  });
  
  // 3. Update item state
  updateItem(sectionIndex, itemIndex, 'reference_photo', data.data.url);
  
  // 4. Save to database immediately (for existing templates)
  if (templateId) {
    await fetch(`http://localhost:3011/api/v1/atp-templates/${templateId}/items/${item.id}/photo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference_photo: data.data.url })
    });
  }
};
```

### 2. TemplatePreview Component
**Location**: `/frontend/src/components/ATPTemplateManagement/TemplatePreview.tsx`

**Photo Display**:
```typescript
{item.evidence_type === 'photo' && (
  <div className="mt-2">
    {item.reference_photo ? (
      <img 
        src={`http://localhost:3011${item.reference_photo}`} 
        alt="Reference" 
        className="w-16 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
        onClick={() => window.open(`http://localhost:3011${item.reference_photo}`, '_blank')}
      />
    ) : (
      <div className="w-16 h-12 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
        <Camera className="w-4 h-4 text-gray-400" />
      </div>
    )}
  </div>
)}
```

## Backend Implementation

### 1. Upload Route Configuration
**Location**: `/backend/src/routes/uploadRoutes.js`

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/reference-photos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ref-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
```

### 2. Template Update Logic
**Location**: `/backend/src/routes/atpTemplateRoutes.js`

```javascript
// Update template - preserves existing sections when not provided
router.put('/:id', async (req, res) => {
  try {
    const { template_name, category, version, scope, sections, is_active } = req.body;

    // Update basic template info
    await prisma.atp_document_templates.update({
      where: { id: req.params.id },
      data: { template_name, category, version, scope, is_active, updated_at: new Date() }
    });

    // Only update sections if explicitly provided
    if (sections !== undefined && Array.isArray(sections)) {
      // Handle sections update logic
    }
    // If sections is undefined, preserve existing sections
  }
});

// Update individual item photo
router.put('/:templateId/items/:itemId/photo', async (req, res) => {
  try {
    const { reference_photo } = req.body;
    
    await prisma.atp_template_items.update({
      where: { id: req.params.itemId },
      data: { reference_photo }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update photo' });
  }
});
```

## Use Cases & Scenarios

### Case 1: Creating New Template with Photos
**Scenario**: User creates a new ATP template and adds reference photos to checklist items.

**Flow**:
1. User clicks "Create Template"
2. Fills basic template information
3. Adds sections and items
4. Clicks on photo upload area for an item
5. Selects image file
6. Photo uploads and displays in preview box
7. User can click photo to zoom
8. Saves template - all data including photos saved to database

**Expected Result**: New template created with reference photos stored and displayed.

### Case 2: Editing Existing Template - Adding Photos
**Scenario**: User edits existing template to add reference photos to items.

**Flow**:
1. User clicks "Edit" on existing template
2. Template loads with existing sections and items
3. User clicks photo upload area for an item
4. Selects image file
5. Photo uploads and immediately saves to database
6. Photo displays in preview box
7. User can continue editing other items
8. Saves template - existing sections preserved, photos maintained

**Expected Result**: Photos added to existing template without losing existing checklist items.

### Case 3: Viewing Template with Photos
**Scenario**: User views template in preview mode to see reference photos.

**Flow**:
1. User clicks "View" on template
2. Template preview loads showing all sections and items
3. Items with photos show thumbnail images
4. User clicks on photo thumbnail
5. Photo opens in new tab at full size
6. User can navigate back to continue viewing

**Expected Result**: All reference photos display correctly and are accessible for viewing.

### Case 4: Photo Upload Failure Handling
**Scenario**: Photo upload fails due to file size, type, or network issues.

**Flow**:
1. User selects invalid file (e.g., PDF, oversized image)
2. Upload attempt fails
3. Error message displays: "Upload failed: Only image files are allowed"
4. User selects valid image file
5. Upload succeeds and photo displays

**Expected Result**: Clear error messages guide user to successful upload.

### Case 5: Template Cloning with Photos
**Scenario**: User clones existing template that contains reference photos.

**Flow**:
1. User clicks "Clone" on template with photos
2. New template created with "(Copy)" suffix
3. All sections, items, and photo references copied
4. Photos remain accessible via original file paths
5. User can edit cloned template independently

**Expected Result**: Cloned template maintains all reference photos from original.

## Error Handling

### 1. Upload Errors
```javascript
// File type validation
if (!allowedTypes.test(mimetype)) {
  return res.status(400).json({ 
    success: false, 
    error: 'Only image files are allowed' 
  });
}

// File size validation
if (file.size > 5 * 1024 * 1024) {
  return res.status(400).json({ 
    success: false, 
    error: 'File size must be less than 5MB' 
  });
}
```

### 2. Database Errors
```javascript
try {
  await prisma.atp_template_items.update({
    where: { id: itemId },
    data: { reference_photo }
  });
} catch (error) {
  console.error('Database error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Failed to save photo reference' 
  });
}
```

### 3. Network Errors
```javascript
// Frontend error handling
try {
  const response = await fetch(uploadUrl, { method: 'POST', body: formData });
  const data = await response.json();
  
  if (!data.success) {
    alert('Upload failed: ' + data.error);
    return;
  }
} catch (error) {
  console.error('Network error:', error);
  alert('Upload failed: Network error');
}
```

## Security Considerations

### 1. File Validation
- **File Type**: Only image files (jpeg, jpg, png, gif, webp) allowed
- **File Size**: Maximum 5MB per file
- **File Name**: Generated unique names prevent conflicts and path traversal

### 2. Storage Security
- **Directory Isolation**: Photos stored in dedicated `/uploads/reference-photos/` directory
- **Static Serving**: Files served through Express static middleware with proper headers
- **Access Control**: Files accessible only through known URLs

### 3. Database Security
- **SQL Injection**: Prisma ORM prevents SQL injection attacks
- **Input Validation**: Photo URLs validated before database storage
- **UUID References**: Template and item IDs use UUIDs for security

## Performance Considerations

### 1. File Storage
- **Local Storage**: Files stored locally for development
- **Production**: Consider cloud storage (AWS S3, Google Cloud) for production
- **CDN**: Implement CDN for faster photo delivery

### 2. Database Optimization
- **Indexes**: Proper indexes on template_id and section_id for fast queries
- **Lazy Loading**: Photos loaded only when template is viewed
- **Caching**: Consider implementing photo URL caching

### 3. Frontend Optimization
- **Image Compression**: Consider client-side image compression before upload
- **Progressive Loading**: Show upload progress for large files
- **Thumbnail Generation**: Generate thumbnails for faster preview loading

## Troubleshooting Guide

### Problem 1: Photos Not Displaying
**Symptoms**: Photo upload succeeds but images don't show in preview
**Causes**:
- Backend server not serving static files
- Incorrect photo URL in database
- CORS issues with image requests

**Solutions**:
```javascript
// Ensure static file serving is configured
app.use('/uploads', express.static('uploads'));

// Check photo URL format
console.log('Photo URL:', item.reference_photo);
// Should be: /uploads/reference-photos/ref-123456789-987654321.jpeg

// Verify file exists
ls -la backend/uploads/reference-photos/
```

### Problem 2: Upload Fails with "API endpoint not found"
**Symptoms**: Photo upload returns 404 error
**Causes**:
- Backend server not running
- Upload routes not properly mounted
- Incorrect API URL in frontend

**Solutions**:
```javascript
// Check backend server status
curl http://localhost:3011/api/v1/upload/test

// Verify route mounting in server.js
app.use("/api/v1/upload", require("./src/routes/uploadRoutes"));

// Check frontend API URL
const response = await fetch('http://localhost:3011/api/v1/upload/reference-photo', {
  method: 'POST',
  body: formData
});
```

### Problem 3: Template Sections Disappear After Photo Upload
**Symptoms**: After uploading photo and saving, all checklist items disappear
**Causes**:
- Frontend sending empty sections array
- Backend deleting sections during update
- Template update logic not preserving existing data

**Solutions**:
```javascript
// Frontend: Don't send sections in basic template update
const cleanedData = {
  template_name: templateData.template_name,
  category: templateData.category,
  version: templateData.version,
  scope: templateData.scope
  // Don't include sections
};

// Backend: Only update sections if explicitly provided
if (sections !== undefined && Array.isArray(sections)) {
  // Update sections logic
}
// If sections undefined, preserve existing sections
```

### Problem 4: Large File Upload Timeout
**Symptoms**: Large image uploads fail with timeout error
**Causes**:
- File size exceeds server limits
- Network timeout during upload
- Multer configuration limits

**Solutions**:
```javascript
// Increase multer limits
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // Increase to 10MB
    fieldSize: 10 * 1024 * 1024
  }
});

// Add client-side compression
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = Math.min(img.width, maxWidth);
      canvas.height = (img.height * canvas.width) / img.width;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

## Future Enhancements

### 1. Advanced Photo Features
- **Multiple Photos**: Support multiple reference photos per item
- **Photo Annotations**: Add text annotations and arrows to photos
- **Photo Comparison**: Before/after photo comparison views
- **Photo Gallery**: Grid view of all template photos

### 2. Cloud Integration
- **AWS S3 Storage**: Move photo storage to cloud
- **CDN Integration**: CloudFront for global photo delivery
- **Image Processing**: Automatic thumbnail generation and optimization

### 3. Mobile Optimization
- **Camera Integration**: Direct camera capture on mobile devices
- **Offline Support**: Cache photos for offline template viewing
- **Touch Gestures**: Pinch-to-zoom and swipe navigation

### 4. Collaboration Features
- **Photo Comments**: Allow comments on reference photos
- **Photo Approval**: Workflow for photo review and approval
- **Version Control**: Track photo changes and revisions

## Conclusion

The ATP Template Photo Upload system provides a comprehensive solution for managing reference photos in acceptance test procedures. The system handles photo upload, storage, display, and management with proper error handling and security measures. The modular architecture allows for easy maintenance and future enhancements while ensuring data integrity and user experience.