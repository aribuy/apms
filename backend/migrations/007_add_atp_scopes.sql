-- Migration 007: Add ATP Scopes (PostgreSQL)
-- Add ATP scopes table and data

CREATE TABLE IF NOT EXISTS atp_scopes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert ATP scopes (ignore duplicates)
INSERT INTO atp_scopes (name, description) VALUES
('ATP Scope', 'General ATP Scope'),
('RAN', 'Radio Access Network'),
('PLN Upgrade', 'PLN Infrastructure Upgrade'),
('Dismantle Keep', 'Equipment Dismantle and Keep'),
('Dismantle Drop', 'Equipment Dismantle and Drop'),
('MW', 'Microwave'),
('MW Upgrade', 'Microwave Upgrade'),
('VLAN Tagging', 'VLAN Configuration and Tagging'),
('IPRAN', 'IP Radio Access Network'),
('IBS Lamp Site', 'Indoor Building Solution Lamp Site'),
('Mini CME', 'Mini Circuit Multiplication Equipment');

-- Add scope_id to digital_documents table (if exists)
-- ALTER TABLE digital_documents 
-- ADD COLUMN scope_id INTEGER REFERENCES atp_scopes(id);