const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

router.get('/api/history/history-patroli-dalam/rekap', async(req, res) => {
    try {
        const query = `
            SELECT id_riwayat, bagian, keterangan_masalah, 
                   DATE_FORMAT(tanggal_selesai, '%d-%m-%Y') AS tanggal_selesai, 
                   jam_selesai
            FROM detail_riwayat_dalam
            ORDER BY id_riwayat DESC, id_rekap DESC;
        `;
        const [results] = await db.execute(query);

        console.log('📊 Query Results:', results); // Debugging

        res.json({ success: true, data: results }); // Pastikan selalu mengembalikan data
    } catch (err) {
        console.error('❌ Error saat mengambil rekap patroli dalam:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;