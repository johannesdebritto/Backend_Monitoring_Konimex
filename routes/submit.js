const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async(req, res) => {
    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID riwayat harus diisi' });
    }

    try {
        // Ambil id_unit dari riwayat
        const [unitResult] = await db.execute(
            'SELECT id_unit FROM riwayat WHERE id_riwayat = ? LIMIT 1', [id_riwayat]
        );

        if (unitResult.length === 0) {
            return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
        }

        const id_unit = unitResult[0].id_unit;

        // Cek apakah ada tugas di unit ini yang belum selesai
        const [statusResult] = await db.execute(
            'SELECT COUNT(*) AS tugasBelumSelesai FROM tugas_unit WHERE id_unit = ? AND id_status != 2', [id_unit]
        );

        if (statusResult[0].tugasBelumSelesai > 0) {
            return res.status(400).json({ message: 'Selesaikan tugas dulu sebelum submit' });
        }

        // Ambil waktu lokal WIB dalam format HH:mm:ss
        const sekarang = new Date();
        const waktu_wib = new Date(sekarang).toLocaleTimeString('en-GB', { hour12: false }); // Format 24 jam

        // Semua tugas sudah selesai, update waktu_selesai dan id_status di riwayat
        await db.execute(
            'UPDATE riwayat SET waktu_selesai = ?, id_status = 2 WHERE id_riwayat = ?', [waktu_wib, id_riwayat]
        );

        res.json({ message: 'Tugas berhasil disubmit!' });
    } catch (err) {
        console.error('Error saat proses submit:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.get('/unit/:id_unit', async(req, res) => {
    const { id_unit } = req.params;

    if (!id_unit) {
        return res.status(400).json({ message: 'ID unit harus diisi' });
    }

    try {
        const [results] = await db.execute(
            `SELECT r.id_riwayat, r.id_unit, u.nama_unit, r.hari, 
                    DATE_FORMAT(CONVERT_TZ(r.tanggal, '+00:00', '+07:00'), '%d-%m-%Y') AS tanggal,  
                    r.waktu_mulai, r.waktu_selesai, r.id_status, s.nama_status
             FROM riwayat r
             JOIN status s ON r.id_status = s.id_status
             JOIN unit u ON r.id_unit = u.id_unit
             WHERE r.id_unit = ?`, [id_unit]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada riwayat untuk unit ini' });
        }

        res.json(results);
    } catch (err) {
        console.error('Error mengambil riwayat:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;