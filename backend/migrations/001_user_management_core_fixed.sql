-- Drop failed tables if they exist
DROP TABLE IF EXISTS workgroup_members CASCADE;
DROP TABLE IF EXISTS workgroups CASCADE;

-- 3. Workgroups (Fixed - using TEXT for user references)
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
  created_by TEXT REFERENCES users(id),  -- Changed to TEXT to match users table
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Workgroup Members (Fixed - using TEXT for user references)
CREATE TABLE IF NOT EXISTS workgroup_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workgroup_id UUID REFERENCES workgroups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,  -- Changed to TEXT
  member_role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  added_by TEXT REFERENCES users(id),  -- Changed to TEXT
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(workgroup_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workgroup_org ON workgroups(organization_id);
CREATE INDEX IF NOT EXISTS idx_workgroup_members_user ON workgroup_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workgroup_members_wg ON workgroup_members(workgroup_id);

SELECT 'Fixed tables created successfully' as status;
