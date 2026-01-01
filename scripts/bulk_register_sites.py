#!/usr/bin/env python3
"""
Bulk Site Registration Script
Generate SQL insert statements from Data ATP endik.xlsx
"""

import pandas as pd
import uuid

# Read Excel data
excel_df = pd.read_excel('Data ATP endik.xlsx')

print(f"Total rows in Excel: {len(excel_df)}")
print(f"\nGenerating SQL for bulk site registration...\n")

# Generate SQL INSERT statements
sql_statements = []

for idx, row in excel_df.iterrows():
    # Parse NE and FE site IDs (comma-separated)
    ne_fe_ids = str(row['Customer Site ID']).split(',')
    ne_fe_names = str(row['Customer Site Name']).split(',')

    ne_site_id = ne_fe_ids[0].strip() if len(ne_fe_ids) > 0 else f"SITE-{idx:04d}-NE"
    fe_site_id = ne_fe_ids[1].strip() if len(ne_fe_ids) > 1 else f"SITE-{idx:04d}-FE"

    ne_site_name = ne_fe_names[0].strip() if len(ne_fe_names) > 0 else f"Site {idx} NE"
    fe_site_name = ne_fe_names[1].strip() if len(ne_fe_names) > 1 else f"Site {idx} FE"

    # Determine region and city
    region = row['Delivery Region'] if pd.notna(row['Delivery Region']) else 'Unknown'
    sow_category = row['SOW TNP'] if pd.notna(row['SOW TNP']) else 'MW Upgrade'
    activity_flow = row['Activity Flow Name'] if pd.notna(row['Activity Flow Name']) else 'MW Upgrade'

    # Generate coordinates (dummy for testing - in production use real coordinates)
    base_lat = -6.0
    base_lng = 113.0
    ne_lat = base_lat + (idx * 0.01)
    ne_lng = base_lng + (idx * 0.01)
    fe_lat = base_lat + (idx * 0.01) + 0.001
    fe_lng = base_lng + (idx * 0.01) + 0.001

    # Determine ATP type from SOW category
    atp_type = 'BOTH'
    if 'Software' in str(sow_category):
        atp_type = 'SOFTWARE'
    elif 'Hardware' in str(sow_category) or 'Upgrade' in str(sow_category):
        atp_type = 'HARDWARE'

    # Create SQL statement
    sql = f"""INSERT INTO sites (
  id, site_id, site_name, scope, region, city,
  ne_latitude, ne_longitude, fe_latitude, fe_longitude,
  status, atp_required, atp_type, workflow_stage,
  created_at, updated_at
) VALUES (
  '{uuid.uuid4()}',
  '{ne_site_id}',
  '{ne_site_name.replace("'", "''")}',
  'MW',
  '{region}',
  '{region}',
  {ne_lat},
  {ne_lng},
  {fe_lat},
  {fe_lng},
  'ACTIVE',
  true,
  '{atp_type}',
  'REGISTERED',
  NOW(),
  NOW()
);"""

    sql_statements.append(sql)

    # Print site info
    print(f"{idx + 1}. {ne_site_id} - {ne_site_name}")
    print(f"   FE: {fe_site_id} - {fe_site_name}")
    print(f"   Region: {region} | ATP: {atp_type}")
    print()

# Save SQL file
output_file = '/Users/endik/Projects/telecore-backup/bulk_register_sites.sql'
with open(output_file, 'w') as f:
    f.write("-- Bulk Site Registration from Data ATP endik.xlsx\n")
    f.write(f"-- Generated: {pd.Timestamp.now()}\n")
    f.write(f"-- Total sites: {len(sql_statements)}\n\n")
    f.write("BEGIN;\n\n")
    for sql in sql_statements:
        f.write(sql + "\n\n")
    f.write("COMMIT;\n")

print(f"\n✅ SQL file saved: {output_file}")
print(f"   Total sites: {len(sql_statements)}")
print(f"\nTo execute:")
print(f"  ssh root@31.97.220.37 'sudo -u postgres psql apms_staging' < {output_file}")

# Also generate CSV for frontend upload
csv_data = []
for idx, row in excel_df.iterrows():
    ne_fe_ids = str(row['Customer Site ID']).split(',')
    ne_fe_names = str(row['Customer Site Name']).split(',')

    ne_site_id = ne_fe_ids[0].strip() if len(ne_fe_ids) > 0 else f"SITE-{idx:04d}-NE"
    fe_site_id = ne_fe_ids[1].strip() if len(ne_fe_ids) > 1 else f"SITE-{idx:04d}-FE"
    ne_site_name = ne_fe_names[0].strip() if len(ne_fe_names) > 0 else f"Site {idx} NE"
    fe_site_name = ne_fe_names[1].strip() if len(ne_fe_names) > 1 else f"Site {idx} FE"

    region = row['Delivery Region'] if pd.notna(row['Delivery Region']) else 'Unknown'
    sow = row['SOW TNP'] if pd.notna(row['SOW TNP']) else 'MW Upgrade'
    activity = row['Activity Flow Name'] if pd.notna(row['Activity Flow Name']) else 'MW Upgrade'

    csv_data.append({
        'Customer Site ID': ne_site_id,
        'Customer Site Name': ne_site_name,
        'Customer Site ID (FE)': fe_site_id,
        'Customer Site Name (FE)': fe_site_name,
        'NE Latitude': -6.0 + (idx * 0.01),
        'NE Longitude': 113.0 + (idx * 0.01),
        'FE Latitude': -6.0 + (idx * 0.01) + 0.001,
        'FE Longitude': 113.0 + (idx * 0.01) + 0.001,
        'Region': region,
        'Coverage Area': f"{region} District",
        'City': region,
        'Scope': 'MW',
        'ATP Required': 'true',
        'ATP Type': 'BOTH',
        'Activity Flow': activity,
        'SOW Category': sow,
        'Project Code': f"MWU-2025-{idx+1}",
        'Frequency': '13GHz',
        'Capacity': '500Mbps',
        'Antenna Size': '0.6m',
        'Equipment Type': 'Nokia AirScale',
        'Status': 'ACTIVE',
        'Scope Description': f"{sow} (MW Upgrade Activity)"
    })

# Save CSV
csv_df = pd.DataFrame(csv_data)
csv_file = '/Users/endik/Projects/telecore-backup/bulk_sites_register.csv'
csv_df.to_csv(csv_file, index=False)

print(f"\n✅ CSV file saved: {csv_file}")
print(f"   Use this for bulk upload via frontend Site Management")
print(f"\n=== BULK REGISTRATION READY ===")
