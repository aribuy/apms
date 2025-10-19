// /Users/endik/Projects/telecore-backup/backend/src/routes/siteRoutes.js

// Pastikan import ini ada di bagian atas file
const Papa = require('papaparse');
// ... import lainnya

// Ganti endpoint '/bulk-upload' yang lama dengan yang ini
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    console.log('Bulk upload request received.');
    if (!req.file) {
        return res.status(400).json({success: false, error: 'No file uploaded'});
    }

    const fs = require('fs');
    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');

        // 1. Parsing Cerdas dengan Papaparse
        const parseResult = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'),
        });

        if (parseResult.errors.length > 0) {
            console.error('CSV Parsing Errors:', parseResult.errors);
            throw new Error('Failed to parse CSV file. Please check the file format.');
        }

        let data = parseResult.data;
        data = data.filter(row => row['customer_site_id'] && String(row['customer_site_id']).trim());

        if (data.length === 0) {
            throw new Error('No valid data rows with customer_site_id found in the file.');
        }

        console.log(`Processing ${data.length} valid rows.`);

        const success = [];
        const errors = [];

        // 2. Proses Setiap Baris dengan Transaksi Individual
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const currentRowNum = i + 2; // Nomor baris di file asli

            try {
                // 3. Validasi Data per Baris
                const siteId = String(row['customer_site_id'] || '').trim();
                const siteName = String(row['customer_site_name'] || '').trim();
                const region = String(row['region'] || row['delivery_region'] || '').trim();

                if (!siteId || !siteName || !region) {
                    throw new Error(`Missing required fields: customer_site_id, customer_site_name, or region`);
                }

                // Fungsi konversi aman untuk tipe Decimal
                const safeParseFloat = (value) => {
                    if (value === null || value === undefined || String(value).trim() === "") return null;
                    const num = parseFloat(String(value));
                    return isNaN(num) ? null : num;
                };

                const siteData = {
                    site_id: siteId,
                    site_name: siteName,
                    site_type: 'MW',
                    region: region,
                    city: String(row['coverage_area'] || region).trim(),
                    ne_latitude: safeParseFloat(row['ne_latitude']),
                    ne_longitude: safeParseFloat(row['ne_longitude']),
                    fe_latitude: safeParseFloat(row['fe_latitude']),
                    fe_longitude: safeParseFloat(row['fe_longitude']),
                    status: 'ACTIVE',
                };

                // 4. Operasi Database Atomik per Baris
                await prisma.$transaction(async (tx) => {
                    const existing = await tx.sites.findUnique({where: {site_id: siteId}});
                    if (existing) {
                        // Ini bukan error fatal, tapi kita laporkan sebagai 'skipped'
                        throw new Error(`Site ID ${siteId} already exists.`);
                    }

                    const site = await tx.sites.create({data: siteData});

                    // Tentukan tipe task ATP dari CSV
                    const atpSoftware = String(row['atp_software_required']).toLowerCase() === 'true';
                    const atpHardware = String(row['atp_hardware_required']).toLowerCase() === 'true';

                    let atpType = 'none';
                    if (atpSoftware && atpHardware) atpType = 'both';
                    else if (atpSoftware) atpType = 'software';
                    else if (atpHardware) atpType = 'hardware';

                    if (atpType !== 'none') {
                        await createATPTasksWithTx(site.site_id, atpType, tx);
                    }
                });

                success.push({row: currentRowNum, siteId: siteId, message: "Registered successfully."});

            } catch (error) {
                console.error(`[Row ${currentRowNum}] Error processing row:`, error.message);
                errors.push({row: currentRowNum, siteId: row['customer_site_id'], error: error.message});
            }
        }

        // 5. Kirim Respons yang Terstruktur
        let message = `Upload completed: ${success.length} sites registered successfully.`;
        if (errors.length > 0) {
            message += ` ${errors.length} rows failed or were skipped.`;
        }

        res.status(201).json({success: true, results: {success, errors, message}});

    } catch (error) {
        console.error('Fatal bulk upload error:', error);
        res.status(500).json({success: false, error: `A fatal error occurred: ${error.message}`});
    } finally {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    }
});