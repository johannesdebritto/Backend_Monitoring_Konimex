const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// Fungsi untuk memperbarui waktu selesai dan status berdasarkan tipe (dalam/luar)
const updateWaktu = async(id_riwayat, tipe, res) => {
    try {
        const waktuSekarang = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Menentukan kolom mana yang akan diperbarui
        const kolomWaktu = tipe === 'dalam' ? 'waktu_selesai_dalam' : 'waktu_selesai_luar';
        const kolomStatus = tipe === 'dalam' ? 'id_status_dalam' : 'id_status_luar';

        // Query untuk update waktu dan status
        const updateQuery = `
            UPDATE riwayat 
            SET ${kolomWaktu} = ?, ${kolomStatus} = 1
            WHERE id_riwayat = ?
        `;

        await db.execute(updateQuery, [waktuSekarang, id_riwayat]);

        console.log(`Update ${kolomWaktu} dan ${kolomStatus} untuk ID Riwayat ${id_riwayat}: ${waktuSekarang}`);

        return res.json({
            message: `Waktu ${tipe} berhasil diperbarui`,
            id_riwayat,
            [kolomWaktu]: waktuSekarang,
            [kolomStatus]: 1
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Endpoint untuk update waktu_selesai_dalam dan id_status_dalam
router.post('/update-waktu-dalam', async(req, res) => {
    console.log("POST /api/status/update-waktu-dalam diakses!");
    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    return updateWaktu(id_riwayat, 'dalam', res);
});

// Endpoint untuk update waktu_selesai_luar dan id_status_luar
router.post('/update-waktu-luar', async(req, res) => {
    console.log("POST /api/status/update-waktu-luar diakses!");
    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    return updateWaktu(id_riwayat, 'luar', res);
});

module.exports = router;