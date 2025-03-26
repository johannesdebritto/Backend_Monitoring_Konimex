const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

router.get('/history-patroli-dalam/rekap', async(req, res) => {
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

router.get('/histori-unit-luar', async(req, res) => {
    try {
        const [results] = await db.execute(
            `SELECT r.id_riwayat, r.id_unit, u.nama_unit, r.hari, 
                    DATE_FORMAT(CONVERT_TZ(r.tanggal, '+00:00', '+07:00'), '%d-%m-%Y') AS tanggal,  
                    r.waktu_mulai_luar, r.waktu_selesai_luar, r.id_status_luar, s.nama_status
             FROM riwayat_luar r
             JOIN status s ON r.id_status_luar = s.id_status
             JOIN unit u ON r.id_unit = u.id_unit`
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada riwayat ditemukan' });
        }

        res.json(results);
    } catch (err) {
        console.error('Error mengambil riwayat:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;