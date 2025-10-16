-- Insert organizations
INSERT INTO organizations (name, code, type) VALUES
('INTERNAL TELECORE', 'TELECORE', 'internal'),
('PT XLSMART Telecom Sejahtera Tbk', 'XLSMART', 'customer'),
('PT MILANO TEKNOLOGI INDONESIA', 'MILANO', 'subcon'),
('PT TOWER BERSAMA', 'TBS', 'tower_provider'),
('PT PROFESIONAL TELEKOMUNIKASI', 'PROTELINDO', 'tower_provider'),
('ZTE CORPORATION', 'ZTE', 'vendor'),
('PT HUAWEI TECH INVESTMENT', 'HUAWEI', 'vendor'),
('PT DAYAMITRA TELEKOMUNIKASI', 'DAYAMITRA', 'vendor'),
('PT KENCANA MANDIRI SEJAHTERA', 'KMS', 'subcon')
ON CONFLICT (code) DO NOTHING;

SELECT 'Organizations loaded' as status;
