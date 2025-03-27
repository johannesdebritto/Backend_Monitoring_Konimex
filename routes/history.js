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

router.get('/history-detail-luar', async(req, res) => {
    try {
        const query = `
            SELECT dr.id_riwayat, dr.id_tugas, tu.nama_tugas, s.nama_status, 
                   dr.keterangan_masalah, 
                   DATE_FORMAT(dr.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
                   TIME_FORMAT(dr.jam_selesai, '%H:%i:%s') AS jam_selesai
            FROM detail_riwayat_luar dr
            JOIN tugas_unit tu ON dr.id_tugas = tu.id_tugas
            JOIN status s ON dr.id_status = s.id_status
            ORDER BY dr.id_riwayat ASC
        `;

        console.log("🔵 [DEBUG] Menjalankan query dengan id_riwayat");

        const [results] = await db.execute(query);

        if (results.length > 0) {
            console.log("✅ [SUCCESS] Data ditemukan:", results);
            res.json(results);
        } else {
            console.warn("⚠️ [WARNING] Tidak ada riwayat ditemukan");
            res.status(404).json({ message: "Tidak ada riwayat ditemukan" });
        }
    } catch (err) {
        console.error("🔥 [ERROR] Terjadi kesalahan saat mengambil detail riwayat:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});


module.exports = router;