-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id VARCHAR(50) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_type VARCHAR(20) DEFAULT 'MW',
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    ne_latitude DECIMAL(10, 8),
    ne_longitude DECIMAL(11, 8),
    fe_latitude DECIMAL(10, 8),
    fe_longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_region ON sites(region);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);