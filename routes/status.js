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

// Fungsi untuk ambil ID anggota dari database berdasarkan nama
const getIdAnggota = async(nama_anggota) => {
    const query = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
    const [rows] = await db.execute(query, [nama_anggota]);
    return rows.length > 0 ? rows[0].id_anggota : null;
};

// Fungsi insert riwayat
const insertRiwayat = async(tipe, data, res) => {
    try {
        const { waktu, tanggal, hari } = getCurrentDateTime();
        const tableName = tipe === 'dalam' ? 'riwayat_dalam' : 'riwayat_luar';
        const waktuKolom = tipe === 'dalam' ? 'waktu_mulai_dalam' : 'waktu_mulai_luar';
        const statusKolom = tipe === 'dalam' ? 'id_status_dalam' : 'id_status_luar';

        const status = data.id_status || 1; // Default ke 1 kalau kosong

        // Ambil ID anggota dari database
        const id_anggota = await getIdAnggota(data.nama_anggota);
        if (!id_anggota) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        console.log(`📌 Menyimpan data ke ${tableName} dengan id_anggota: ${id_anggota}`);

        // Insert ke database
        const insertQuery = `
            INSERT INTO ${tableName} (id_unit, id_patroli, id_anggota, id_unit_kerja, ${statusKolom}, ${waktuKolom}, tanggal, hari)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(insertQuery, [
            data.id_unit,
            data.id_patroli,
            id_anggota, // Pakai ID anggota yang sudah diambil dari database
            data.id_unit_kerja,
            status,
            waktu,
            tanggal,
            hari
        ]);

        console.log(`✅ Data berhasil ditambahkan ke ${tableName}`);

        return res.json({ message: `Waktu ${tipe} berhasil diperbarui` });
    } catch (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// Endpoint untuk update riwayat dalam
router.post('/update-waktu-dalam', async(req, res) => {
    console.log("📢 POST /api/status/update-waktu-dalam diakses!");
    console.log("📦 Request Body:", req.body);

    const { id_unit, id_patroli, nama_anggota, id_unit_kerja, id_status } = req.body;

    if (!id_unit || !id_patroli || !nama_anggota || !id_unit_kerja) {
        console.log("❌ Data tidak lengkap!");
        return res.status(400).json({ message: 'Semua data harus diisi' });
    }

    return insertRiwayat('dalam', { id_unit, id_patroli, nama_anggota, id_unit_kerja, id_status }, res);
});

// Endpoint untuk update riwayat luar
router.post('/update-waktu-luar', async(req, res) => {
    console.log("📢 POST /api/status/update-waktu-luar diakses!");
    console.log("📦 Request Body:", req.body);

    const { id_unit, id_patroli, nama_anggota, id_unit_kerja, id_status } = req.body;

    if (!id_unit || !id_patroli || !nama_anggota || !id_unit_kerja) {
        console.log("❌ Data tidak lengkap!");
        return res.status(400).json({ message: 'Semua data harus diisi' });
    }

    return insertRiwayat('luar', { id_unit, id_patroli, nama_anggota, id_unit_kerja, id_status }, res);
});

module.exports = router;