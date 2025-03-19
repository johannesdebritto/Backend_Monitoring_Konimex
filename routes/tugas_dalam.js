const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// Fungsi untuk mendapatkan tanggal dalam format DD-MM-YYYY
const getCurrentDate = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1)
        .toString().padStart(2, '0')}-${now.getFullYear()}`;
};

// Fungsi untuk mendapatkan waktu dalam format HH:mm:ss
const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 8);
};

// Endpoint untuk submit patroli dalam
router.post('/submit-patroli-dalam', async(req, res) => {
    try {
        const { nama_anggota, bagian, keterangan_masalah, id_status } = req.body;
        const tanggal = getCurrentDate();
        const jam = getCurrentTime();

        if (!nama_anggota || !id_status) {
            return res.status(400).json({ message: 'Nama anggota dan id_status harus disertakan' });
        }

        // Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;

        // Simpan ke tabel detail_riwayat_dalam
        const insertQuery = `
            INSERT INTO detail_riwayat_dalam (id_anggota, id_status, bagian, keterangan_masalah, tanggal_selesai, jam_selesai)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.execute(insertQuery, [id_anggota, id_status, bagian, keterangan_masalah, tanggal, jam]);

        res.json({ message: 'Data patroli dalam berhasil disimpan' });
    } catch (err) {
        console.error('Error saat menyimpan data patroli dalam:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;