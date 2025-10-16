-- Get organization IDs and create workgroups
WITH org_ids AS (
  SELECT id, code FROM organizations
)
INSERT INTO workgroups (name, organization_id, workgroup_type, classification, category, created_by) VALUES
('HQ Operations Team', (SELECT id FROM org_ids WHERE code='TELECORE'), 'internal', 'team', 'Internal', 
  (SELECT id FROM users WHERE email='admin@telecore.com')),
('Field Operations Surabaya', (SELECT id FROM org_ids WHERE code='MILANO'), 'external', 'team', 'Subcon',
  (SELECT id FROM users WHERE email='admin@telecore.com')),
('Network Planning Division', (SELECT id FROM org_ids WHERE code='XLSMART'), 'internal', 'functional_group', 'Customer',
  (SELECT id FROM users WHERE email='admin@telecore.com')),
('Tower Installation Team', (SELECT id FROM org_ids WHERE code='TBS'), 'external', 'team', 'Tower Provider',
  (SELECT id FROM users WHERE email='admin@telecore.com'))
ON CONFLICT DO NOTHING;

SELECT 'Sample workgroups created' as status;
