# ATP Process Flow - Test Users for End-to-End Testing

## System Overview
**PT Aviat** (Internal) - System Owner
**PT XLSMART** (Customer) - ATP Approvers  
**External Vendors** - ATP Document Submitters

## Test User Credentials

### PT Aviat (Internal)
| Role | Email | Password | Function |
|------|-------|----------|----------|
| **System Admin** | admin@aviat.com | Admin123! | Full system access |
| **Document Control** | doc.control@aviat.com | test123 | ATP document upload & control |

### PT XLSMART (Customer - Approvers)

#### Software Flow Approvers
| Stage | Role | Email | Password | Function |
|-------|------|-------|----------|----------|
| **Stage 1** | Business Operations | business.ops@xlsmart.co.id | test123 | Software ATP initial review |
| **Stage 2** | SME Team | sme.team@xlsmart.co.id | test123 | Software ATP technical review |
| **Stage 3** | Head NOC | noc.head@xlsmart.co.id | test123 | Software ATP final approval |

#### Hardware Flow Approvers  
| Stage | Role | Email | Password | Function |
|-------|------|-------|----------|----------|
| **Stage 1** | FOP RTS | fop.rts@xlsmart.co.id | test123 | Hardware ATP initial review |
| **Stage 2** | Region Team | region.team@xlsmart.co.id | test123 | Hardware ATP regional review |
| **Stage 3** | RTH Head | rth.head@xlsmart.co.id | test123 | Hardware ATP final approval |

### External Vendors
| Vendor | Email | Password | Function |
|--------|-------|----------|----------|
| **ZTE** | vendor.zte@gmail.com | test123 | ATP document submission |
| **HTI** | vendor.hti@gmail.com | test123 | ATP document submission |

## ATP Process Flow

### Software Flow
1. **Document Control** uploads ATP document
2. **System** categorizes as Software
3. **BO** → **SME** → **Head NOC** (approval chain)

### Hardware Flow  
1. **Document Control** uploads ATP document
2. **System** categorizes as Hardware
3. **FOP RTS** → **Region Team** → **RTH** (approval chain)

## Punchlist Decision Matrix
- **No PL**: Proceed to next stage / Full approval
- **PL Major/Minor**: Proceed with punchlist / Approved with punchlist
- **PL Critical**: Return to rectification (mandatory site fix)

## Testing Scenarios
1. **Software ATP - Clean Approval**: No punchlist through all stages
2. **Software ATP - With Minor PL**: Approved with punchlist
3. **Software ATP - Critical PL**: Rejected for rectification
4. **Hardware ATP - Clean Approval**: No punchlist through all stages  
5. **Hardware ATP - With Minor PL**: Approved with punchlist
6. **Hardware ATP - Critical PL**: Rejected for rectification

## Access URLs
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/
- **ATP Management**: Available after login based on role permissions