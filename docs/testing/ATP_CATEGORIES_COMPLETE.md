# ATP Categories & Workflow Configuration - Complete

**Created:** 2026-01-01
**Source:** ATP Process Flow Excel (Worksheet in XLS ATP Process Flow.xlsx)
**Version:** v2.7 (Last Update: 13-Aug-25)

---

## Overview

Based on the ATP Process Flow Excel, there are **5 main ATP categories**, each with different workflow stages and approval levels.

**Key Findings:**
- Total ATP Categories: **5 types**
- Each category has different approval workflow
- Approval levels: 2-4 stages depending on category
- Vendor-specific logic applies (ZTE, HTI, Aviat, Alita, LTE)

---

## Complete ATP Categories

### 1. RAN (Radio Access Network) / MW (Microwave)

**Sheet:** `RAN_MW`
**Full Name:** RAN & MW ATP
**Vendors:** ZTE, HTI, Aviat
**Subtypes:**
- **MW New** - New microwave installation
- **MW Upgrade** - Microwave upgrade/upgrade N+0
- **MW Reroute** - Microwave rerouting
- **RAN** - Radio Access Network equipment

**Workflow Configuration:**
```javascript
{
  category: 'RAN_MW',
  workflow_type: 'HARDWARE',  // Hardware-focused workflow
  stages: [
    {
      code: 'FOP_RTS_REVIEW',
      name: 'MS RTS Review (Level 2)',
      role: 'FOP_RTS',  // First Party of Record / RTS
      sla_hours: 48
    },
    {
      code: 'REGION_REVIEW',
      name: 'XLSMART RTH Team Review (Level 3)',
      role: 'REGION_TEAM',  // Regional Team Head
      sla_hours: 48
    },
    {
      code: 'RTH_REVIEW',
      name: 'XLSMART RTH Final Approval (Level 4)',
      role: 'RTH',  // Regional Technical Head
      sla_hours: 24
    }
  ]
}
```

**Approval Matrix (from Approval_Matrix sheet):**
- **RTS:** Approver (A) - Required
- **BO:** Approver (A) - Required
- **RTH Team:** Approver (A) - Required
- **RTH:** Approver (A) - Required

**Total Stages:** 3 stages
**SLA Total:** 120 hours (5 days)

---

### 2. PLN Upgrade

**Sheet:** `PLN_Upgrade`
**Full Name:** PLN (Power) Upgrade ATP
**Vendors:** All vendors (PLN-related)

**Description:** Power infrastructure upgrades, including electrical installations, power capacity upgrades, PLN meter installations.

**Workflow Configuration:**
```javascript
{
  category: 'PLN_UPGRADE',
  workflow_type: 'HARDWARE',  // Hardware/power-focused workflow
  stages: [
    {
      code: 'ROH_REVIEW',
      name: 'MS ROH Review (Level 2)',
      role: 'ROH',  // Roll Out Head
      sla_hours: 48
    },
    {
      code: 'RTH_REVIEW',
      name: 'XLSMART RTH Team Final Approval (Level 3)',
      role: 'RTH',  // Regional Technical Head
      sla_hours: 24
    }
  ]
}
```

**Approval Matrix (from Approval_Matrix sheet):**
- **ROH:** Approver (A) - Required
- **RTH Team:** Approver (A) - Required

**Total Stages:** 2 stages
**SLA Total:** 72 hours (3 days)

**Note:** Shorter workflow than RAN/MW due to simpler scope

---

### 3. Dismantle - Drop

**Sheet:** `Dismantle_Drop`
**Full Name:** Dismantle (Drop Equipment) ATP
**Vendors:** All vendors

**Description:** Complete site dismantling where equipment is dropped/removed (not kept). Equipment removal, site decommissioning.

**Workflow Configuration:**
```javascript
{
  category: 'DISMANTLE_DROP',
  workflow_type: 'HARDWARE',  // Hardware dismantling workflow
  stages: [
    {
      code: 'FOP_RTS_REVIEW',
      name: 'MS RTS Review (Level 2)',
      role: 'FOP_RTS',  // First Party of Record / RTS
      sla_hours: 48
    },
    {
      code: 'REGION_REVIEW',
      name: 'XLSMART RTH Team Review (Level 3)',
      role: 'REGION_TEAM',  // Regional Team Head
      sla_hours: 48
    },
    {
      code: 'PMO_REVIEW',
      name: 'XLSMART PMO Review (Level 4)',
      role: 'PMO',  // Project Management Office
      sla_hours: 48
    }
  ]
}
```

**Approval Matrix (from Approval_Matrix sheet):**
- **RTS:** Approver (A) - Required
- **RTH Team:** Approver (A) - Required
- **PMO:** Approver (A) - Required

**Total Stages:** 3 stages
**SLA Total:** 144 hours (6 days)

**Note:** PMO approval required for asset disposal/loss validation

---

### 4. Dismantle - Keep

**Sheet:** `Dismantle_Keep`
**Full Name:** Dismantle (Keep Equipment) ATP
**Vendors:** All vendors

**Description:** Site dismantling where equipment is kept/inventory (not dropped). Equipment removal for reuse/reallocation.

**Workflow Configuration:**
```javascript
{
  category: 'DISMANTLE_KEEP',
  workflow_type: 'HARDWARE',  // Hardware dismantling workflow
  stages: [
    {
      code: 'ROH_REVIEW',
      name: 'MS ROH Review (Level 2)',
      role: 'ROH',  // Roll Out Head
      sla_hours: 48
    },
    {
      code: 'RTH_REVIEW',
      name: 'XLSMART RTH Team Final Approval (Level 3)',
      role: 'RTH',  // Regional Technical Head
      sla_hours: 24
    }
  ]
}
```

**Approval Matrix (from Approval_Matrix sheet):**
- **ROH:** Approver (A) - Required
- **RTH Team:** Approver (A) - Required

**Total Stages:** 2 stages
**SLA Total:** 72 hours (3 days)

**Note:** Simpler than "Drop" because equipment is retained (no PMO needed)

---

### 5. Software / License / Upgrade

**Source:** Inferred from existing workflow + Excel Activity Flow names
**Full Name:** Software & License ATP
**Vendors:** ZTE, HTI, Aviat, LTE, Alita

**Subtypes:**
- **Software License** - New software licenses
- **License Upgrade (UG)** - License capacity upgrades
- **Bandwidth Upgrade** - Bandwidth capacity increases
- **Modulation** - Modulation scheme changes
- **Configuration** - Software configuration changes

**Workflow Configuration:**
```javascript
{
  category: 'SOFTWARE_LICENSE',
  workflow_type: 'SOFTWARE',  // Software-focused workflow
  stages: [
    {
      code: 'BO_REVIEW',
      name: 'Business Operations Review',
      role: 'BO',  // Business Operations
      sla_hours: 48
    },
    {
      code: 'SME_REVIEW',
      name: 'SME Technical Review',
      role: 'SME',  // Subject Matter Expert
      sla_hours: 48
    },
    {
      code: 'HEAD_NOC_REVIEW',
      name: 'Head NOC Final Review',
      role: 'HEAD_NOC',  // Head of Network Operations Center
      sla_hours: 24
    }
  ]
}
```

**Approval Matrix (from Approval_Matrix sheet):**
- **BO:** Approver (A) - Required
- **RTH Team:** Approver (A) - Required (for some types)
- **NOC Head:** Approver (A) - Required

**Total Stages:** 3 stages
**SLA Total:** 120 hours (5 days)

---

## Summary Table

| Category | Subtype | Workflow Type | Stages | Total SLA | Approval Roles |
|----------|---------|---------------|--------|-----------|----------------|
| **RAN_MW** | RAN, MW New, MW Upgrade, MW Reroute | HARDWARE | 3 | 120h (5d) | FOP_RTS → REGION_TEAM → RTH |
| **PLN_UPGRADE** | PLN Upgrade | HARDWARE | 2 | 72h (3d) | ROH → RTH |
| **DISMANTLE_DROP** | Dismantle Drop | HARDWARE | 3 | 144h (6d) | FOP_RTS → REGION_TEAM → PMO |
| **DISMANTLE_KEEP** | Dismantle Keep | HARDWARE | 2 | 72h (3d) | ROH → RTH |
| **SOFTWARE_LICENSE** | Software, License, Upgrade, Bandwidth, Modulation | SOFTWARE | 3 | 120h (5d) | BO → SME → HEAD_NOC |

---

## Role Definitions

Based on Excel data, here are the role definitions:

### Level 2 Reviewers (First Technical Review)
- **FOP_RTS** (First Party of Record / RTS): Field implementation lead responsible for initial technical review
- **ROH** (Roll Out Head): Head of rollout operations for power/dismantle projects

### Level 3 Reviewers (Regional/Functional Review)
- **REGION_TEAM** (XLSMART RTH Team): Regional technical team lead
- **SME** (Subject Matter Expert): Technical specialist for software/configuration
- **RTH** (Regional Technical Head): Regional head (can be L3 or L4 depending on workflow)
- **PMO** (Project Management Office): Project management oversight for dismantle-drop

### Level 4 Reviewers (Final Approval)
- **RTH** (Regional Technical Head): Final regional approval
- **HEAD_NOC** (Head of Network Operations Center): Final NOC approval for software

### Business Review
- **BO** (Business Operations): Business/commercial review for software licenses

---

## Updated WORKFLOW_CONFIG

Based on the Excel data, here is the **corrected** workflow configuration:

```javascript
const WORKFLOW_CONFIG = {
  // 1. RAN & MW (Hardware workflow - 3 stages)
  RAN_MW: {
    stages: [
      { code: 'FOP_RTS_REVIEW', name: 'MS RTS Review', role: 'FOP_RTS', sla_hours: 48 },
      { code: 'REGION_REVIEW', name: 'XLSMART RTH Team Review', role: 'REGION_TEAM', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'XLSMART RTH Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },

  // 2. PLN Upgrade (Hardware workflow - 2 stages)
  PLN_UPGRADE: {
    stages: [
      { code: 'ROH_REVIEW', name: 'MS ROH Review', role: 'ROH', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'XLSMART RTH Team Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },

  // 3. Dismantle Drop (Hardware workflow - 3 stages)
  DISMANTLE_DROP: {
    stages: [
      { code: 'FOP_RTS_REVIEW', name: 'MS RTS Review', role: 'FOP_RTS', sla_hours: 48 },
      { code: 'REGION_REVIEW', name: 'XLSMART RTH Team Review', role: 'REGION_TEAM', sla_hours: 48 },
      { code: 'PMO_REVIEW', name: 'XLSMART PMO Review', role: 'PMO', sla_hours: 48 }
    ]
  },

  // 4. Dismantle Keep (Hardware workflow - 2 stages)
  DISMANTLE_KEEP: {
    stages: [
      { code: 'ROH_REVIEW', name: 'MS ROH Review', role: 'ROH', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'XLSMART RTH Team Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  },

  // 5. Software & License (Software workflow - 3 stages)
  SOFTWARE_LICENSE: {
    stages: [
      { code: 'BO_REVIEW', name: 'Business Operations Review', role: 'BO', sla_hours: 48 },
      { code: 'SME_REVIEW', name: 'SME Technical Review', role: 'SME', sla_hours: 48 },
      { code: 'HEAD_NOC_REVIEW', name: 'Head NOC Final Review', role: 'HEAD_NOC', sla_hours: 24 }
    ]
  },

  // Legacy mappings (for backward compatibility)
  SOFTWARE: {
    stages: [
      { code: 'BO_REVIEW', name: 'Business Operations Review', role: 'BO', sla_hours: 48 },
      { code: 'SME_REVIEW', name: 'SME Technical Review', role: 'SME', sla_hours: 48 },
      { code: 'HEAD_NOC_REVIEW', name: 'Head NOC Final Review', role: 'HEAD_NOC', sla_hours: 24 }
    ]
  },
  HARDWARE: {
    stages: [
      { code: 'FOP_RTS_REVIEW', name: 'FOP/RTS Field Review', role: 'FOP_RTS', sla_hours: 48 },
      { code: 'REGION_REVIEW', name: 'Region Team Review', role: 'REGION_TEAM', sla_hours: 48 },
      { code: 'RTH_REVIEW', name: 'RTH Final Approval', role: 'RTH', sla_hours: 24 }
    ]
  }
};
```

---

## Auto-Categorization Logic Updates

The existing auto-categorization utility ([`atpCategorization.js`](../../backend/src/utils/atpCategorization.js)) needs to be updated to recognize all 5 categories:

### Current Categories (Existing)
- **SOFTWARE** - Software license, upgrade, configuration
- **HARDWARE** - Equipment installation, hardware

### New Categories (Required)
- **PLN_UPGRADE** - Power infrastructure upgrades
- **DISMANTLE_DROP** - Site dismantling with equipment drop
- **DISMANTLE_KEEP** - Site dismantling with equipment keep

### Enhanced Categorization Rules

```javascript
const categorizeFromFilename = (filename) => {
  const lowerFilename = filename.toLowerCase();

  // PLN Upgrade indicators
  const plnIndicators = {
    'pln': 100,
    'power': 90,
    'electrical': 80,
    'meter': 70,
    'power upgrade': 100
  };

  // Dismantle Drop indicators
  const dismantleDropIndicators = {
    'dismantle': 80,
    'drop': 70,
    'decommission': 90,
    'remove': 60
  };

  // Dismantle Keep indicators
  const dismantleKeepIndicators = {
    'dismantle': 80,
    'keep': 70,
    'inventory': 60,
    'reuse': 50
  };

  // Software indicators (existing)
  const softwareIndicators = {
    'sw license': 100,
    'license ug': 90,
    'ug bw': 80,
    'modulation': 70,
    'configuration': 60
  };

  // RAN/MW indicators (existing hardware)
  const hardwareIndicators = {
    'installation': 80,
    'hardware': 80,
    'equipment': 70,
    'antenna': 70,
    'mw': 60,
    'ran': 60
  };

  // Score calculation...
  // Return category with highest score
};
```

---

## Missing Categories

From the Excel Approval Matrix sheet, there are additional categories mentioned but without detailed workflow:
- **MW Upgrade** - May be same as RAN_MW
- **VLAN Tagging** - Network configuration
- **IPRAN** - IP Radio Access Network
- **IBS Lamp Site** - In-Building Solutions
- **Mini CME** - Configuration Management

**Recommendation:** Confirm with business if these require separate workflows or can be grouped under existing categories.

---

## Implementation Priority

### Phase 1: Update Workflow Config (CRITICAL)
1. Update `WORKFLOW_CONFIG` in [`atpWorkflowRoutes.js`](../../backend/src/routes/atpWorkflowRoutes.js) with 5 categories
2. Add ROH and PMO roles to user roles
3. Update database to support new roles

### Phase 2: Update Auto-Categorization (HIGH)
1. Update [`atpCategorization.js`](../../backend/src/utils/atpCategorization.js) to recognize all 5 categories
2. Add categorization rules for PLN, Dismantle Drop/Keep
3. Test categorization accuracy

### Phase 3: Update Frontend (HIGH)
1. Update ATP upload form to show 5 categories
2. Add manual category override (Doc Control can change auto-categorization)
3. Update workflow display to show correct stages based on category

### Phase 4: Testing & Documentation (MEDIUM)
1. Test each category workflow
2. Verify approval flows for each category
3. Update user documentation
4. Train users on new categories

---

## Next Steps

1. **Confirm categories** - Verify with business that all 5 categories are correct
2. **Confirm roles** - Verify ROH and PMO roles exist in user management
3. **Confirm workflows** - Verify stage count and approval levels for each category
4. **Update code** - Implement updated WORKFLOW_CONFIG
5. **Test** - End-to-end testing for each category

---

**Document Status:** READY FOR REVIEW
**Next Action:** Confirm categories and workflows with business stakeholders
