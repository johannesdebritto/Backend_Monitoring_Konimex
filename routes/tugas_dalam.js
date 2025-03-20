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

router.post('/submit-patroli-dalam', async(req, res) => {
    try {
        const { id_riwayat, nama_anggota, bagian, keterangan_masalah, id_status } = req.body;
        const tanggalTampilan = getFormattedDate(); // Format DD-MM-YYYY
        const tanggalMySQL = getMySQLDate(); // Format YYYY-MM-DD
        const jam = getCurrentTime();

        console.log("Data diterima dari Flutter:", req.body);

        if (!id_riwayat || !nama_anggota || !id_status) {
            return res.status(400).json({ message: 'ID riwayat, nama anggota, dan id_status harus disertakan' });
        }

        // Pastikan id_riwayat berupa integer
        const id_riwayat_int = parseInt(id_riwayat, 10);
        if (isNaN(id_riwayat_int)) {
            return res.status(400).json({ message: 'ID riwayat tidak valid' });
        }

        // Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;

        console.log("ID Anggota ditemukan:", id_anggota);

        // Simpan ke tabel detail_riwayat_dalam
        const insertQuery = `
            INSERT INTO detail_riwayat_dalam 
            (id_riwayat, id_anggota, id_status, bagian, keterangan_masalah, tanggal_selesai, jam_selesai) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        console.log("Data yang akan disimpan:", {
            id_riwayat: id_riwayat_int,
            id_anggota,
            id_status,
            bagian,
            keterangan_masalah,
            tanggalMySQL,
            jam
        });

        const [result] = await db.execute(insertQuery, [
            id_riwayat_int, id_anggota, id_status, bagian, keterangan_masalah, tanggalMySQL, jam
        ]);

        console.log("Query berhasil dieksekusi:", result);

        res.json({
            message: 'Data patroli dalam berhasil disimpan',
            id_riwayat: id_riwayat_int,
            tanggal_tampilan: tanggalTampilan,
            jam: jam
        });
    } catch (err) {
        console.error('Error saat menyimpan data patroli dalam:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server', error: err.message });
    }
});

// Endpoint untuk mendapatkan daftar patroli dalam berdasarkan id_riwayat
router.get('/patroli-dalam/:id_riwayat', async(req, res) => {
    try {
        const { id_riwayat } = req.params;
        const query = `
            SELECT bagian, keterangan_masalah, 
                   DATE_FORMAT(tanggal_selesai, '%d-%m-%Y') AS tanggal_selesai, 
                   jam_selesai
            FROM detail_riwayat_dalam
            WHERE id_riwayat = ?
            ORDER BY id_rekap DESC
        `;
        const [results] = await db.execute(query, [id_riwayat]);

        res.json(results);
    } catch (err) {
        console.error('Error saat mengambil data patroli dalam:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.post('/update-status-dalam', async(req, res) => {
    console.log("POST /api/status/update-status-dalam diakses!");
    const { id_riwayat } = req.body;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    try {
        const waktuSekarang = getCurrentTime();

        // 1️⃣ Update tabel `riwayat`
        const updateRiwayatQuery = `
            UPDATE riwayat 
            SET id_status_dalam = 2, waktu_selesai_dalam = ?
            WHERE id_riwayat = ?
        `;
        await db.execute(updateRiwayatQuery, [waktuSekarang, id_riwayat]);

        // 2️⃣ Update tabel `detail_riwayat_dalam`
        const updateDetailQuery = `
            UPDATE detail_riwayat_dalam 
            SET id_status = 2
            WHERE id_riwayat = ?
        `;
        await db.execute(updateDetailQuery, [id_riwayat]);

        console.log(`✅ Update berhasil untuk ID Riwayat ${id_riwayat} pada ${waktuSekarang}`);

        return res.json({
            message: 'Status dalam berhasil diperbarui',
            id_riwayat,
            id_status_dalam: 2,
            waktu_selesai_dalam: waktuSekarang
        });

    } catch (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});
///
// Endpoint untuk mendapatkan jumlah masalah berdasarkan id_riwayat
router.get('/patroli-dalam/jumlah/:id_riwayat', async(req, res) => {
    try {
        const { id_riwayat } = req.params;
        const query = `
            SELECT COUNT(*) AS jumlah_masalah 
            FROM detail_riwayat_dalam 
            WHERE id_riwayat = ?
        `;
        const [results] = await db.execute(query, [id_riwayat]);

        res.json({ jumlah_masalah: results[0].jumlah_masalah });
    } catch (err) {
        console.error('Error saat mengambil jumlah masalah:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.get('/riwayat/:id_riwayat', async(req, res) => {
    console.log("GET /api/riwayat/:id_riwayat diakses!");
    const { id_riwayat } = req.params;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID Riwayat harus diisi' });
    }

    try {
        const query = `
            SELECT bagian, keterangan_masalah, waktu, tanggal 
            FROM detail_riwayat_dalam 
            WHERE id_riwayat = ?
        `;
        const [rows] = await db.execute(query, [id_riwayat]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Data tidak ditemukan' });
        }

        return res.json(rows); // ✅ Balikin semua data (array)
    } catch (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});


module.exports = router;