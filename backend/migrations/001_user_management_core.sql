-- 1. Geographic Hierarchy
CREATE TABLE IF NOT EXISTS geographic_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INTEGER NOT NULL CHECK (level IN (1,2,3,4)),
  code VARCHAR(50) UNIQUE,
  name VARCHAR(200) NOT NULL,
  parent_id UUID REFERENCES geographic_hierarchy(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE,
  type VARCHAR(20) CHECK (type IN ('internal', 'customer', 'vendor', 'tower_provider', 'subcon')) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  parent_org_id UUID REFERENCES organizations(id),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Workgroups
CREATE TABLE IF NOT EXISTS workgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  workgroup_type VARCHAR(20) CHECK (workgroup_type IN ('internal', 'external', 'all')) NOT NULL,
  classification VARCHAR(20) CHECK (classification IN ('team', 'functional_group')) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('Internal', 'Customer', 'Subcon', 'Vendor', 'Tower Provider')) NOT NULL,
  parent_workgroup_id UUID REFERENCES workgroups(id),
  email VARCHAR(255),
  max_members INT DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Workgroup Members
CREATE TABLE IF NOT EXISTS workgroup_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID REFERENCES workgroups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  added_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(workgroup_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_geo_level ON geographic_hierarchy(level);
CREATE INDEX IF NOT EXISTS idx_geo_parent ON geographic_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_workgroup_org ON workgroups(organization_id);

-- Success message
SELECT 'Tables created successfully' as status;
