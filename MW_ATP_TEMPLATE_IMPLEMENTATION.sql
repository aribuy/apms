-- MW ATP Template Implementation for XLSmart
-- Based on analysis of XLSmart MW ATP documents

-- Insert MW ATP Template
INSERT INTO atp_document_templates (
    template_code, 
    template_name, 
    category, 
    version,
    form_schema, 
    checklist_items,
    workflow_config
) VALUES (
    'MW_XLSMART_V1', 
    'XLSmart MW ATP - Microwave Link Template', 
    'hardware',
    '1.0',
    '{
        "sections": [
            {
                "id": "project_info",
                "title": "Project Information",
                "fields": [
                    {"name": "project_name", "type": "text", "required": true, "label": "Project Name"},
                    {"name": "site_a_id", "type": "text", "required": true, "label": "Site A ID"},
                    {"name": "site_a_name", "type": "text", "required": true, "label": "Site A Name"},
                    {"name": "site_b_id", "type": "text", "required": true, "label": "Site B ID"},
                    {"name": "site_b_name", "type": "text", "required": true, "label": "Site B Name"},
                    {"name": "link_id", "type": "text", "required": true, "label": "Link ID"},
                    {"name": "hop_distance", "type": "text", "required": true, "label": "Hop Distance (km)"},
                    {"name": "frequency_band", "type": "select", "required": true, "label": "Frequency Band", 
                     "options": ["6 GHz", "7 GHz", "8 GHz", "11 GHz", "13 GHz", "15 GHz", "18 GHz", "23 GHz", "38 GHz", "80 GHz"]}
                ]
            },
            {
                "id": "equipment_details",
                "title": "Equipment Details",
                "fields": [
                    {"name": "vendor", "type": "select", "required": true, "label": "Vendor", 
                     "options": ["Ericsson", "Nokia", "Huawei", "NEC", "Aviat", "Ceragon", "DragonWave"]},
                    {"name": "equipment_model", "type": "text", "required": true, "label": "Equipment Model"},
                    {"name": "software_version", "type": "text", "required": true, "label": "Software Version"},
                    {"name": "license_type", "type": "select", "required": true, "label": "License Type",
                     "options": ["Basic", "Enhanced", "Premium", "Upgrade"]},
                    {"name": "bandwidth_capacity", "type": "select", "required": true, "label": "Bandwidth Capacity",
                     "options": ["E1", "STM-1", "10 Mbps", "50 Mbps", "100 Mbps", "200 Mbps", "500 Mbps", "1 Gbps"]},
                    {"name": "modulation", "type": "select", "required": true, "label": "Modulation",
                     "options": ["QPSK", "16QAM", "32QAM", "64QAM", "128QAM", "256QAM", "512QAM", "1024QAM"]}
                ]
            },
            {
                "id": "site_a_config",
                "title": "Site A Configuration",
                "fields": [
                    {"name": "site_a_coordinates", "type": "coordinates", "required": true, "label": "Site A GPS Coordinates"},
                    {"name": "site_a_antenna_height", "type": "text", "required": true, "label": "Antenna Height (m)"},
                    {"name": "site_a_antenna_model", "type": "text", "required": true, "label": "Antenna Model"},
                    {"name": "site_a_antenna_gain", "type": "text", "required": true, "label": "Antenna Gain (dBi)"},
                    {"name": "site_a_tx_power", "type": "text", "required": true, "label": "TX Power (dBm)"},
                    {"name": "site_a_rx_threshold", "type": "text", "required": true, "label": "RX Threshold (dBm)"},
                    {"name": "site_a_frequency", "type": "text", "required": true, "label": "TX/RX Frequency (MHz)"}
                ]
            },
            {
                "id": "site_b_config",
                "title": "Site B Configuration", 
                "fields": [
                    {"name": "site_b_coordinates", "type": "coordinates", "required": true, "label": "Site B GPS Coordinates"},
                    {"name": "site_b_antenna_height", "type": "text", "required": true, "label": "Antenna Height (m)"},
                    {"name": "site_b_antenna_model", "type": "text", "required": true, "label": "Antenna Model"},
                    {"name": "site_b_antenna_gain", "type": "text", "required": true, "label": "Antenna Gain (dBi)"},
                    {"name": "site_b_tx_power", "type": "text", "required": true, "label": "TX Power (dBm)"},
                    {"name": "site_b_rx_threshold", "type": "text", "required": true, "label": "RX Threshold (dBm)"},
                    {"name": "site_b_frequency", "type": "text", "required": true, "label": "TX/RX Frequency (MHz)"}
                ]
            },
            {
                "id": "rf_measurements",
                "title": "RF Measurements & Performance",
                "fields": [
                    {"name": "path_loss", "type": "text", "required": true, "label": "Path Loss (dB)"},
                    {"name": "fade_margin", "type": "text", "required": true, "label": "Fade Margin (dB)"},
                    {"name": "rsl_site_a", "type": "text", "required": true, "label": "RSL Site A (dBm)"},
                    {"name": "rsl_site_b", "type": "text", "required": true, "label": "RSL Site B (dBm)"},
                    {"name": "ber_measurement", "type": "text", "required": true, "label": "BER Measurement"},
                    {"name": "availability", "type": "text", "required": true, "label": "Link Availability (%)"},
                    {"name": "throughput_test", "type": "text", "required": true, "label": "Throughput Test Result"}
                ]
            },
            {
                "id": "network_integration",
                "title": "Network Integration",
                "fields": [
                    {"name": "ip_configuration", "type": "textarea", "required": true, "label": "IP Configuration"},
                    {"name": "vlan_config", "type": "textarea", "required": false, "label": "VLAN Configuration"},
                    {"name": "qos_settings", "type": "textarea", "required": false, "label": "QoS Settings"},
                    {"name": "snmp_config", "type": "textarea", "required": false, "label": "SNMP Configuration"},
                    {"name": "nms_integration", "type": "select", "required": true, "label": "NMS Integration Status",
                     "options": ["Completed", "Pending", "Not Required"]}
                ]
            },
            {
                "id": "testing_results",
                "title": "Testing & Validation",
                "fields": [
                    {"name": "link_test_duration", "type": "text", "required": true, "label": "Link Test Duration (hours)"},
                    {"name": "error_free_seconds", "type": "text", "required": true, "label": "Error Free Seconds (%)"},
                    {"name": "severely_errored_seconds", "type": "text", "required": true, "label": "Severely Errored Seconds"},
                    {"name": "unavailable_seconds", "type": "text", "required": true, "label": "Unavailable Seconds"},
                    {"name": "traffic_test_result", "type": "select", "required": true, "label": "Traffic Test Result",
                     "options": ["Pass", "Fail", "Conditional Pass"]},
                    {"name": "backup_restoration_test", "type": "select", "required": true, "label": "Backup/Restoration Test",
                     "options": ["Pass", "Fail", "Not Applicable"]}
                ]
            },
            {
                "id": "documentation",
                "title": "Documentation & Attachments",
                "fields": [
                    {"name": "installation_photos", "type": "file", "required": true, "label": "Installation Photos"},
                    {"name": "configuration_backup", "type": "file", "required": true, "label": "Configuration Backup Files"},
                    {"name": "test_reports", "type": "file", "required": true, "label": "Test Reports"},
                    {"name": "as_built_drawings", "type": "file", "required": false, "label": "As-Built Drawings"},
                    {"name": "additional_notes", "type": "textarea", "required": false, "label": "Additional Notes"}
                ]
            }
        ]
    }'::jsonb,
    '[
        {
            "section": "Pre-Installation Checks",
            "items": [
                "Site survey completed and documented",
                "Line of sight confirmed between sites",
                "Frequency coordination approved",
                "Equipment delivery verified",
                "Installation permits obtained"
            ]
        },
        {
            "section": "Physical Installation",
            "items": [
                "Antenna alignment completed within tolerance",
                "Waveguide installation and testing completed",
                "Grounding system installed and tested",
                "Power systems connected and verified",
                "Equipment rack installation completed"
            ]
        },
        {
            "section": "RF Configuration & Testing",
            "items": [
                "Frequency configuration verified",
                "TX power levels set and verified",
                "RX threshold levels confirmed",
                "Path loss measurements completed",
                "Fade margin calculations verified"
            ]
        },
        {
            "section": "Network Integration",
            "items": [
                "IP addressing configured and tested",
                "VLAN configuration implemented",
                "QoS parameters configured",
                "SNMP monitoring configured",
                "NMS integration completed"
            ]
        },
        {
            "section": "Performance Testing",
            "items": [
                "Link availability test completed (24h minimum)",
                "Throughput testing completed",
                "BER measurements within specification",
                "Error performance testing completed",
                "Backup/restoration functionality tested"
            ]
        },
        {
            "section": "Documentation & Handover",
            "items": [
                "Installation photos documented",
                "Configuration files backed up",
                "Test reports generated",
                "As-built documentation updated",
                "Handover to operations team completed"
            ]
        }
    ]'::jsonb,
    '{
        "workflow_type": "hardware",
        "approval_sequence": ["FOP_RTS", "REGION_TEAM", "RTH"],
        "required_roles": {
            "upload": ["VENDOR_MW"],
            "review": ["FOP_RTS", "REGION_TEAM"],
            "approve": ["RTH"]
        },
        "auto_notifications": true,
        "sla_hours": 72
    }'::jsonb
);

-- Insert MW Upgrade Template
INSERT INTO atp_document_templates (
    template_code, 
    template_name, 
    category, 
    version,
    form_schema, 
    checklist_items,
    workflow_config
) VALUES (
    'MW_UPGRADE_XLSMART_V1', 
    'XLSmart MW Upgrade ATP - Software/License/Bandwidth Template', 
    'software',
    '1.0',
    '{
        "sections": [
            {
                "id": "upgrade_info",
                "title": "Upgrade Information",
                "fields": [
                    {"name": "upgrade_type", "type": "select", "required": true, "label": "Upgrade Type",
                     "options": ["Software Upgrade", "License Upgrade", "Bandwidth Upgrade", "Modulation Upgrade", "Combined Upgrade"]},
                    {"name": "existing_link_id", "type": "text", "required": true, "label": "Existing Link ID"},
                    {"name": "site_a_id", "type": "text", "required": true, "label": "Site A ID"},
                    {"name": "site_b_id", "type": "text", "required": true, "label": "Site B ID"},
                    {"name": "upgrade_reason", "type": "textarea", "required": true, "label": "Upgrade Reason/Justification"},
                    {"name": "planned_downtime", "type": "text", "required": true, "label": "Planned Downtime (minutes)"}
                ]
            },
            {
                "id": "current_config",
                "title": "Current Configuration",
                "fields": [
                    {"name": "current_sw_version", "type": "text", "required": true, "label": "Current Software Version"},
                    {"name": "current_license", "type": "text", "required": true, "label": "Current License Type"},
                    {"name": "current_bandwidth", "type": "text", "required": true, "label": "Current Bandwidth"},
                    {"name": "current_modulation", "type": "text", "required": true, "label": "Current Modulation"},
                    {"name": "current_performance", "type": "textarea", "required": true, "label": "Current Performance Metrics"}
                ]
            },
            {
                "id": "target_config",
                "title": "Target Configuration",
                "fields": [
                    {"name": "target_sw_version", "type": "text", "required": true, "label": "Target Software Version"},
                    {"name": "target_license", "type": "text", "required": true, "label": "Target License Type"},
                    {"name": "target_bandwidth", "type": "text", "required": true, "label": "Target Bandwidth"},
                    {"name": "target_modulation", "type": "text", "required": true, "label": "Target Modulation"},
                    {"name": "expected_performance", "type": "textarea", "required": true, "label": "Expected Performance Improvement"}
                ]
            },
            {
                "id": "upgrade_execution",
                "title": "Upgrade Execution",
                "fields": [
                    {"name": "backup_completed", "type": "select", "required": true, "label": "Configuration Backup Completed",
                     "options": ["Yes", "No"]},
                    {"name": "upgrade_method", "type": "select", "required": true, "label": "Upgrade Method",
                     "options": ["Remote", "On-site", "Hybrid"]},
                    {"name": "actual_downtime", "type": "text", "required": true, "label": "Actual Downtime (minutes)"},
                    {"name": "upgrade_status", "type": "select", "required": true, "label": "Upgrade Status",
                     "options": ["Successful", "Failed", "Partial", "Rolled Back"]},
                    {"name": "rollback_plan", "type": "textarea", "required": true, "label": "Rollback Plan"}
                ]
            },
            {
                "id": "post_upgrade_testing",
                "title": "Post-Upgrade Testing",
                "fields": [
                    {"name": "link_stability_test", "type": "text", "required": true, "label": "Link Stability Test Duration (hours)"},
                    {"name": "performance_verification", "type": "textarea", "required": true, "label": "Performance Verification Results"},
                    {"name": "throughput_improvement", "type": "text", "required": false, "label": "Throughput Improvement (%)"},
                    {"name": "error_rate_check", "type": "text", "required": true, "label": "Error Rate Check Results"},
                    {"name": "feature_validation", "type": "textarea", "required": false, "label": "New Feature Validation"}
                ]
            },
            {
                "id": "validation_documentation",
                "title": "Validation & Documentation",
                "fields": [
                    {"name": "before_upgrade_config", "type": "file", "required": true, "label": "Before Upgrade Configuration"},
                    {"name": "after_upgrade_config", "type": "file", "required": true, "label": "After Upgrade Configuration"},
                    {"name": "test_results", "type": "file", "required": true, "label": "Test Results Documentation"},
                    {"name": "performance_comparison", "type": "file", "required": false, "label": "Performance Comparison Report"},
                    {"name": "upgrade_notes", "type": "textarea", "required": false, "label": "Upgrade Notes & Observations"}
                ]
            }
        ]
    }'::jsonb,
    '[
        {
            "section": "Pre-Upgrade Preparation",
            "items": [
                "Current configuration backed up",
                "Upgrade plan reviewed and approved",
                "Rollback procedure documented",
                "Maintenance window scheduled",
                "Stakeholders notified"
            ]
        },
        {
            "section": "Upgrade Execution",
            "items": [
                "Software/license upgrade completed successfully",
                "System reboot completed without issues",
                "Basic connectivity restored",
                "Configuration parameters verified",
                "No critical alarms present"
            ]
        },
        {
            "section": "Post-Upgrade Validation",
            "items": [
                "Link performance meets specifications",
                "Throughput improvement verified (if applicable)",
                "Error rates within acceptable limits",
                "New features functioning correctly",
                "System stability confirmed over test period"
            ]
        },
        {
            "section": "Documentation & Handover",
            "items": [
                "Updated configuration documented",
                "Performance comparison completed",
                "Test results documented",
                "Operations team briefed on changes",
                "Upgrade completion confirmed"
            ]
        }
    ]'::jsonb,
    '{
        "workflow_type": "software",
        "approval_sequence": ["BO", "SME", "HEAD_NOC"],
        "required_roles": {
            "upload": ["VENDOR_MW"],
            "review": ["BO", "SME"],
            "approve": ["HEAD_NOC"]
        },
        "auto_notifications": true,
        "sla_hours": 48
    }'::jsonb
);

-- Update atp_scopes to ensure MW scopes are properly configured
UPDATE atp_scopes SET 
    description = 'Microwave Link Installation and Configuration'
WHERE name = 'MW';

UPDATE atp_scopes SET 
    description = 'Microwave Software, License, and Bandwidth Upgrades'
WHERE name = 'MW Upgrade';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_atp_templates_mw ON atp_document_templates(template_code) 
WHERE template_code LIKE 'MW_%';

COMMENT ON TABLE atp_document_templates IS 'Enhanced with MW ATP templates for XLSmart microwave link testing';