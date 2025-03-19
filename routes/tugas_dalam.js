const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// Fungsi untuk mendapatkan tanggal dalam format DD-MM-YYYY (untuk tampilan)
const getFormattedDate = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1)
        .toString().padStart(2, '0')}-${now.getFullYear()}`;
};

// Fungsi untuk mendapatkan tanggal dalam format YYYY-MM-DD (untuk MySQL)
const getMySQLDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
};

// Fungsi untuk mendapatkan waktu dalam format HH:mm:ss
const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 8);
};

// Endpoint untuk submit patroli dalam
router.post('/submit-patroli-dalam', async(req, res) => {
    try {
        const { id_riwayat, nama_anggota, bagian, keterangan_masalah, id_status } = req.body;
        const tanggalTampilan = getFormattedDate(); // Format untuk tampilan (DD-MM-YYYY)
        const tanggalMySQL = getMySQLDate(); // Format untuk MySQL (YYYY-MM-DD)
        const jam = getCurrentTime();

        if (!id_riwayat || !nama_anggota || !id_status) {
            return res.status(400).json({ message: 'ID riwayat, nama anggota, dan id_status harus disertakan' });
        }

        // Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;

        // Simpan ke tabel detail_riwayat_dalam dengan menyertakan id_riwayat
        const insertQuery = `
            INSERT INTO detail_riwayat_dalam (id_riwayat, id_anggota, id_status, bagian, keterangan_masalah, tanggal_selesai, jam_selesai)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await db.execute(insertQuery, [id_riwayat, id_anggota, id_status, bagian, keterangan_masalah, tanggalMySQL, jam]);

        res.json({
            message: 'Data patroli dalam berhasil disimpan',
            id_riwayat,
            tanggal_tampilan: tanggalTampilan, // Kirim balik format DD-MM-YYYY
            jam: jam
        });
    } catch (err) {
        console.error('Error saat menyimpan data patroli dalam:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Endpoint untuk mendapatkan daftar patroli dalam
router.get('/patroli-dalam', async(req, res) => {
    try {
        const query = `
            SELECT bagian, keterangan_masalah, 
                   DATE_FORMAT(tanggal_selesai, '%d-%m-%Y') AS tanggal_selesai, 
                   jam_selesai
            FROM detail_riwayat_dalam
            ORDER BY id_rekap DESC
        `;
        const [results] = await db.execute(query);

        res.json(results);
    } catch (err) {
        console.error('Error saat mengambil data patroli dalam:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});



// Endpoint untuk update id_status_dalam dan waktu_selesai_dalam
router.post('/update-status-dalam', async(req, res) => {
    console.log("POST /api/status/update-status-dalam diakses!");
    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    try {
        const waktuSekarang = getCurrentTime();
        const updateQuery = `
            UPDATE riwayat 
            SET id_status_dalam = 2, waktu_selesai_dalam = ?
            WHERE id_riwayat = ?
        `;

        await db.execute(updateQuery, [waktuSekarang, id_riwayat]);

        console.log(`Update status dalam selesai untuk ID Riwayat ${id_riwayat} pada ${waktuSekarang}`);

        return res.json({
            message: 'Status dalam berhasil diperbarui',
            id_riwayat,
            id_status_dalam: 2,
            waktu_selesai_dalam: waktuSekarang
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});
module.exports = router;