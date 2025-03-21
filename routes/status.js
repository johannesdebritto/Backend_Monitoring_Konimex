const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (num) => (num < 10 ? `0${num}` : num);
    return {
        waktu: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`, // HH:mm:ss
        tanggal: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`, // YYYY-MM-DD
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()]
    };
};

// Menambahkan pengecekan pada id_status
const insertRiwayat = async(id_riwayat, tipe, data, res) => {
    try {
        const { waktu, tanggal, hari } = getCurrentDateTime();
        const tableName = tipe === 'dalam' ? 'riwayat_dalam' : 'riwayat_luar';
        const waktuKolom = tipe === 'dalam' ? 'waktu_mulai_dalam' : 'waktu_mulai_luar';
        const statusKolom = tipe === 'dalam' ? 'id_status_dalam' : 'id_status_luar';

        // Cek jika id_status kosong, set default
        const status = data.id_status || 1;

        // Debugging untuk lihat data sebelum query
        console.log(`Menerima data untuk ${tableName}:`, data);

        // Query untuk menyimpan/update riwayat
        const insertQuery = `
            INSERT INTO ${tableName} (id_riwayat, id_unit, id_patroli, id_anggota, id_unit_kerja, ${statusKolom}, ${waktuKolom}, tanggal, hari)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ${waktuKolom} = VALUES(${waktuKolom}), ${statusKolom} = VALUES(${statusKolom}), tanggal = VALUES(tanggal), hari = VALUES(hari)
        `;

        await db.execute(insertQuery, [
            id_riwayat,
            data.id_unit,
            data.id_patroli,
            data.id_anggota,
            data.id_unit_kerja,
            status, // Gunakan status yang sudah ditentukan
            waktu,
            tanggal,
            hari
        ]);

        console.log(`✅ Data ${tableName} diperbarui untuk ID Riwayat ${id_riwayat}`);

        return res.json({
            message: `Waktu ${tipe} berhasil diperbarui`,
            id_riwayat,
            waktu_mulai: waktu,
            tanggal,
            hari,
            status
        });
    } catch (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Endpoint untuk update riwayat dalam
router.post('/update-waktu-dalam', async(req, res) => {
    console.log("📢 POST /api/status/update-waktu-dalam diakses!");
    console.log("📦 Request Body:", req.body);

    const { id_riwayat, id_unit, id_patroli, id_anggota, id_unit_kerja } = req.body;

    if (!id_riwayat || !id_unit || !id_patroli || !id_anggota || !id_unit_kerja) {
        console.log("❌ Data tidak lengkap!");
        return res.status(400).json({ message: 'Semua data harus diisi' });
    }

    return insertRiwayat(id_riwayat, 'dalam', { id_unit, id_patroli, id_anggota, id_unit_kerja }, res);
});

// Endpoint untuk update riwayat luar
router.post('/update-waktu-luar', async(req, res) => {
    console.log("📢 POST /api/status/update-waktu-luar diakses!");
    console.log("📦 Request Body:", req.body);

    const { id_riwayat, id_unit, id_patroli, id_anggota, id_unit_kerja } = req.body;

    if (!id_riwayat || !id_unit || !id_patroli || !id_anggota || !id_unit_kerja) {
        console.log("❌ Data tidak lengkap!");
        return res.status(400).json({ message: 'Semua data harus diisi' });
    }

    return insertRiwayat(id_riwayat, 'luar', { id_unit, id_patroli, id_anggota, id_unit_kerja }, res);
});

module.exports = router;