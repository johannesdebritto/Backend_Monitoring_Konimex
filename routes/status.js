const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// Endpoint untuk update waktu_selesai_dalam
router.post('/update-waktu-dalam', async(req, res) => {
    console.log("POST /api/status/update-waktu-dalam diakses!");

    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    try {
        const waktuSekarang = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const updateQuery = `
            UPDATE riwayat 
            SET waktu_selesai_dalam = ? 
            WHERE id_riwayat = ?
        `;

        await db.execute(updateQuery, [waktuSekarang, id_riwayat]);

        console.log(`Waktu selesai dalam diperbarui untuk ID Riwayat ${id_riwayat}: ${waktuSekarang}`);

        return res.json({ message: 'Waktu selesai dalam berhasil diperbarui', id_riwayat, waktu_selesai_dalam: waktuSekarang });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Endpoint untuk update waktu_selesai_luar
router.post('/update-waktu-luar', async(req, res) => {
    console.log("POST /api/status/update-waktu-luar diakses!");

    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    try {
        const waktuSekarang = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const updateQuery = `
            UPDATE riwayat 
            SET waktu_selesai_luar = ? 
            WHERE id_riwayat = ?
        `;

        await db.execute(updateQuery, [waktuSekarang, id_riwayat]);

        console.log(`Waktu selesai luar diperbarui untuk ID Riwayat ${id_riwayat}: ${waktuSekarang}`);

        return res.json({ message: 'Waktu selesai luar berhasil diperbarui', id_riwayat, waktu_selesai_luar: waktuSekarang });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;