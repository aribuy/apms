# MW ATP Implementation Guide - XLSmart Integration

## Overview
Implementasi MW (Microwave) ATP untuk PT XLSmart berdasarkan analisis dokumen ATP yang telah disediakan. Sistem ini mendukung dua jenis MW ATP:

1. **MW Installation ATP** - Hardware installation dan konfigurasi link microwave baru
2. **MW Upgrade ATP** - Software, license, dan bandwidth upgrade untuk link existing

## Files Created

### 1. Database Templates
- **File**: `MW_ATP_TEMPLATE_IMPLEMENTATION.sql`
- **Purpose**: Template database untuk MW ATP forms
- **Templates**:
  - `MW_XLSMART_V1` - MW Installation Template
  - `MW_UPGRADE_XLSMART_V1` - MW Upgrade Template

### 2. React Components
- **File**: `frontend/src/components/ATPManagement/MWATPForm.tsx`
- **Purpose**: Specialized MW ATP form dengan validation dan checklist
- **Features**:
  - MW-specific validation rules
  - Progress tracking
  - Technical standards checking
  - Interactive checklist

### 3. Enhanced Scope Selector
- **File**: `frontend/src/components/ATPManagement/ScopeSelector.tsx` (Updated)
- **Purpose**: Enhanced scope selection dengan MW visual indicators
- **Features**:
  - MW-specific icons dan colors
  - Detailed view mode
  - Category descriptions

### 4. Installation Script
- **File**: `install-mw-templates.js`
- **Purpose**: Automated installation script untuk MW templates
- **Usage**: `node install-mw-templates.js`

## MW ATP Template Structure

### MW Installation Template (MW_XLSMART_V1)

#### Form Sections:
1. **Project Information**
   - Project name, Site A/B details, Link ID
   - Hop distance, Frequency band

2. **Equipment Details**
   - Vendor, Model, Software version
   - License type, Bandwidth capacity, Modulation

3. **Site A Configuration**
   - GPS coordinates, Antenna details
   - TX power, RX threshold, Frequencies

4. **Site B Configuration**
   - Mirror of Site A configuration

5. **RF Measurements & Performance**
   - Path loss, Fade margin, RSL measurements
   - BER, Availability, Throughput tests

6. **Network Integration**
   - IP configuration, VLAN, QoS
   - SNMP, NMS integration

7. **Testing & Validation**
   - Test duration, Error metrics
   - Traffic tests, Backup tests

8. **Documentation & Attachments**
   - Photos, Configuration backups
   - Test reports, As-built drawings

#### Validation Rules:
- Fade margin ≥ 20dB
- Link availability ≥ 99.9%
- Frequency separation ≥ 100MHz
- BER ≤ 10^-6

### MW Upgrade Template (MW_UPGRADE_XLSMART_V1)

#### Form Sections:
1. **Upgrade Information**
   - Upgrade type, Link ID, Justification
   - Planned downtime

2. **Current Configuration**
   - Current SW version, License, Bandwidth
   - Current performance metrics

3. **Target Configuration**
   - Target specifications
   - Expected improvements

4. **Upgrade Execution**
   - Backup status, Method, Actual downtime
   - Status, Rollback plan

5. **Post-Upgrade Testing**
   - Stability test, Performance verification
   - Feature validation

6. **Validation & Documentation**
   - Before/after configurations
   - Test results, Performance comparison

## Workflow Integration

### MW Installation (Hardware Flow)
```
VENDOR_MW → FOP_RTS → REGION_TEAM → RTH
```

### MW Upgrade (Software Flow)
```
VENDOR_MW → BO → SME → HEAD_NOC
```

## Installation Steps

### 1. Install MW Templates
```bash
# Run installation script
node install-mw-templates.js
```

### 2. Verify Database
```sql
-- Check templates
SELECT template_code, template_name, category 
FROM atp_document_templates 
WHERE template_code LIKE 'MW_%';

-- Check scopes
SELECT name, description 
FROM atp_scopes 
WHERE name LIKE '%MW%';
```

### 3. Update Frontend Components
The following components need to be integrated:

#### Update ATPManagement/index.tsx
```typescript
import MWATPForm from './MWATPForm';

// Add MW form routing logic
if (scopeName === 'MW' || scopeName === 'MW Upgrade') {
  return (
    <MWATPForm
      atpId={atpId}
      scopeType={scopeName === 'MW' ? 'MW' : 'MW_UPGRADE'}
      onFormSubmit={handleFormSubmit}
      initialData={initialData}
    />
  );
}
```

#### Update ScopeSelector Usage
```typescript
<ScopeSelector
  value={selectedScope}
  onChange={(scopeId, scopeName) => {
    setSelectedScope(scopeId);
    setScopeName(scopeName);
  }}
  showDetails={true} // Enable detailed MW view
  required={true}
/>
```

## Testing MW ATP

### Test Users Available
```javascript
// MW Vendor
{
  email: 'mw.vendor@gmail.com',
  password: 'password123',
  role: 'VENDOR_MW'
}

// XLSmart FOP RTS
{
  email: 'fop.rts@xlsmart.co.id',
  password: 'password123',
  role: 'FOP_RTS'
}

// XLSmart Region Team
{
  email: 'region.team@xlsmart.co.id',
  password: 'password123',
  role: 'REGION_TEAM'
}

// XLSmart RTH
{
  email: 'rth@xlsmart.co.id',
  password: 'password123',
  role: 'RTH'
}
```

### Test Scenarios

#### 1. MW Installation ATP
1. Login as `mw.vendor@gmail.com`
2. Create new ATP with MW scope
3. Fill MW installation form
4. Upload supporting documents
5. Submit for review
6. Login as XLSmart users to approve

#### 2. MW Upgrade ATP
1. Login as `mw.vendor@gmail.com`
2. Create new ATP with MW Upgrade scope
3. Fill upgrade form with before/after configs
4. Upload configuration backups
5. Submit for software workflow approval

## MW-Specific Features

### 1. Technical Validation
- **Fade Margin Check**: Ensures ≥20dB for reliable links
- **Availability Check**: Validates ≥99.9% availability
- **Frequency Coordination**: Checks TX/RX separation
- **Performance Metrics**: BER, RSL, throughput validation

### 2. Progress Tracking
- Real-time form completion percentage
- Section-by-section progress indicators
- Visual feedback for validation status

### 3. Interactive Checklist
- Pre-installation checks
- Installation verification
- Testing validation
- Documentation requirements

### 4. File Management
- Configuration backup uploads
- Test report attachments
- Installation photos
- As-built documentation

## Integration with Existing System

### Database Schema
MW templates integrate seamlessly with existing:
- `atp_document_templates` table
- `atp_documents` table with JSONB form_data
- `atp_document_attachments` for file uploads
- `atp_scopes` for MW and MW Upgrade scopes

### Workflow Engine
Uses existing workflow engine with:
- Hardware flow for MW installations
- Software flow for MW upgrades
- Role-based permissions
- Automatic notifications

### User Management
Leverages existing RBAC system:
- VENDOR_MW role for uploads
- XLSmart roles for approvals
- Permission-based UI filtering

## Next Steps

1. **Run Installation**: Execute `install-mw-templates.js`
2. **Test MW Forms**: Use test users to validate MW ATP flow
3. **Document Analysis**: Review actual XLSmart MW ATP PDFs for additional fields
4. **Customization**: Adjust templates based on specific XLSmart requirements
5. **Training**: Prepare user training materials for MW ATP process

## Support

For issues or customizations:
1. Check database template installation
2. Verify component imports and routing
3. Test with provided test users
4. Review validation rules for MW-specific requirements

The MW ATP system is now ready for XLSmart integration and testing!