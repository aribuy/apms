-- Insert L1 Regions
INSERT INTO geographic_hierarchy (level, code, name) VALUES
(1, 'NSU', 'NORTH SUMATERA'),
(1, 'JBT', 'JABODETABEK'),
(1, 'WJV', 'WEST JAVA'),
(1, 'CJV', 'CENTRAL JAVA'),
(1, 'EJV', 'EAST JAVA'),
(1, 'SSU', 'SOUTH SUMATERA'),
(1, 'SKL', 'SULAWESI KALIMANTAN')
ON CONFLICT (code) DO NOTHING;

-- Insert sample L2 Cities
INSERT INTO geographic_hierarchy (level, code, name, parent_id) VALUES
(2, 'MDN', 'MEDAN', (SELECT id FROM geographic_hierarchy WHERE code='NSU' AND level=1)),
(2, 'JKT', 'JAKARTA', (SELECT id FROM geographic_hierarchy WHERE code='JBT' AND level=1)),
(2, 'BDG', 'BANDUNG', (SELECT id FROM geographic_hierarchy WHERE code='WJV' AND level=1)),
(2, 'SMG', 'SEMARANG', (SELECT id FROM geographic_hierarchy WHERE code='CJV' AND level=1)),
(2, 'SBY', 'SURABAYA', (SELECT id FROM geographic_hierarchy WHERE code='EJV' AND level=1)),
(2, 'PLB', 'PALEMBANG', (SELECT id FROM geographic_hierarchy WHERE code='SSU' AND level=1)),
(2, 'BPN', 'BALIKPAPAN', (SELECT id FROM geographic_hierarchy WHERE code='SKL' AND level=1))
ON CONFLICT (code) DO NOTHING;

SELECT 'Geographic data loaded' as status;
