const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

router.post('/login', async(req, res) => {
    console.log("POST /api/auth/login diakses!");
    console.log("Body yang diterima:", req.body);

    const { email, password, nama_anggota } = req.body;

    if (!email || !password || !nama_anggota) {
        return res.status(400).json({ message: 'Email, password, dan nama anggota harus diisi' });
    }

    try {
        const queryUnit = 'SELECT id_unit, nama_unit FROM unit WHERE email = ? AND password_gedung = ?';
        const [unitResults] = await db.execute(queryUnit, [email, password]);

        if (unitResults.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        const { id_unit, nama_unit } = unitResults[0];

        // 🔹 Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Nama anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;
        console.log("Dapat ID Anggota:", id_anggota);

        // 🔹 Cek apakah ada riwayat sebelumnya untuk id_unit
        const queryRiwayat = `
            SELECT id_riwayat FROM riwayat 
            WHERE id_unit = ? 
            ORDER BY id_riwayat DESC LIMIT 1
        `;
        const [riwayatResult] = await db.execute(queryRiwayat, [id_unit]);

        let id_riwayat;

        if (riwayatResult.length > 0) {
            id_riwayat = riwayatResult[0].id_riwayat;
            console.log("Pakai ID Riwayat lama:", id_riwayat);

            // 🔹 Update riwayat lama dengan id_anggota (jika masih NULL)
            const updateRiwayat = 'UPDATE riwayat SET id_anggota = ? WHERE id_riwayat = ? AND id_anggota IS NULL';
            await db.execute(updateRiwayat, [id_anggota, id_riwayat]);
        } else {
            // 🔹 Buat riwayat baru dengan id_anggota
            const sekarang = new Date();
            const hari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
            const tanggal = sekarang.toISOString().split('T')[0];
            const waktu_mulai = sekarang.toTimeString().split(' ')[0];

            const insertRiwayat = `
                INSERT INTO riwayat (id_unit, id_anggota, hari, tanggal, waktu_mulai) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(insertRiwayat, [id_unit, id_anggota, hari, tanggal, waktu_mulai]);
            id_riwayat = result.insertId;
            console.log("Insert ID Riwayat baru:", id_riwayat);
        }

        return res.json({
            message: riwayatResult.length > 0 ? 'Login berhasil (Pakai riwayat lama)' : 'Login berhasil (Riwayat baru dibuat)',
            id_unit,
            nama_unit,
            id_riwayat,
            nama_anggota
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.get('/unit/validate', async(req, res) => {
    const { email, password } = req.query; // Ambil email & password dari URL

    if (!email || !password) {
        return res.status(400).json({ message: "Email dan Password wajib diisi" });
    }

    try {
        const query = `SELECT password_gedung FROM unit WHERE email = ?`;
        const [results] = await db.execute(query, [email]);

        if (results.length === 0) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        const storedPassword = results[0].password_gedung;

        if (storedPassword !== password) {
            return res.status(401).json({ message: "Email atau Password salah" });
        }

        res.json({ message: "Valid" });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});



router.get('/unit/list', async(req, res) => {
    try {
        const query = `SELECT email FROM unit LIMIT 5`; // Ambil semua email unit (bisa diubah batasnya)
        const [results] = await db.execute(query);
        const emails = results.map(row => row.email);
        res.json(emails);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Autocomplete Nama Anggota
router.get('/anggota/search', async(req, res) => {
    try {
        const search = req.query.q;
        if (!search) {
            return res.status(400).json({ message: 'Query pencarian tidak boleh kosong' });
        }

        const query = `SELECT nama_anggota FROM anggota WHERE nama_anggota LIKE ? LIMIT 8`;
        const searchTerm = `%${search}%`;

        const [results] = await db.execute(query, [searchTerm]);
        const anggotaNames = results.map(row => row.nama_anggota); // Ambil hanya nama_anggota
        res.json(anggotaNames);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.get('/unit_kerja/list', async(req, res) => {
    try {
        const query = `SELECT nama_unit FROM unit_kerja LIMIT 8`;
        const [results] = await db.execute(query);

        // Mengubah hasil query menjadi array string saja
        const unitNames = results.map(row => row.nama_unit);

        res.json(unitNames); // Mengirimkan array string langsung
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.get('/patroli/list', async(req, res) => {
    try {
        const query = `SELECT nomor_patroli FROM patroli LIMIT 8`;
        const [results] = await db.execute(query);

        // Mengubah hasil query menjadi array string saja
        const patroliNumbers = results.map(row => row.nomor_patroli);

        res.json(patroliNumbers); // Mengirimkan array string langsung
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

module.exports = router;