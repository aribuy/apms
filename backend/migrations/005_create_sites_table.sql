-- Create sites table
CREATE TABLE sites (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(20) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_type VARCHAR(50) NOT NULL,
    region VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude INTEGER,
    tower_height INTEGER,
    power_type VARCHAR(50) NOT NULL,
    backup_power VARCHAR(50) NOT NULL,
    fiber_connection VARCHAR(10) NOT NULL,
    microwave_connection VARCHAR(10) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'PLANNING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_sites_site_id ON sites(site_id);
CREATE INDEX idx_sites_region ON sites(region);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_site_type ON sites(site_type);

-- Insert sample data
INSERT INTO sites (site_id, site_name, site_type, region, province, city, district, address, latitude, longitude, altitude, tower_height, power_type, backup_power, fiber_connection, microwave_connection, contact_person, contact_phone, contact_email, status) VALUES
('JKT001', 'Jakarta Central BTS', 'BTS', 'Jakarta', 'DKI Jakarta', 'Jakarta Pusat', 'Menteng', 'Jl. Thamrin No. 1', -6.200000, 106.816666, 10, 42, 'PLN', 'Genset', 'Yes', 'No', 'John Doe', '081234567890', 'john@example.com', 'ACTIVE'),
('BDG001', 'Bandung North NodeB', 'NodeB', 'Bandung', 'Jawa Barat', 'Bandung', 'Coblong', 'Jl. Dago No. 15', -6.900000, 107.618889, 768, 35, 'PLN', 'Battery', 'Yes', 'Yes', 'Jane Smith', '081234567891', 'jane@example.com', 'PLANNING'),
('SBY001', 'Surabaya East eNodeB', 'eNodeB', 'Surabaya', 'Jawa Timur', 'Surabaya', 'Gubeng', 'Jl. Pemuda No. 25', -7.250000, 112.750000, 5, 40, 'PLN', 'Genset', 'No', 'Yes', 'Bob Wilson', '081234567892', 'bob@example.com', 'CONSTRUCTION');