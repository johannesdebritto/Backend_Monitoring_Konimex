const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

router.post('/login', async(req, res) => {
    console.log("POST /api/auth/login diakses!");
    console.log("Body yang diterima:", req.body);

    const { email, password, anggota1, anggota2, patroli, unit_kerja } = req.body;

    if (!email || !password || !anggota1 || !patroli || !unit_kerja) {
        return res.status(400).json({ message: 'Email, password, anggota1, patroli, dan unit kerja harus diisi' });
    }

    try {
        const queryUnit = 'SELECT id_unit, nama_unit FROM unit WHERE email = ? AND password_gedung = ?';
        const [unitResults] = await db.execute(queryUnit, [email, password]);

        if (unitResults.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        const { id_unit, nama_unit } = unitResults[0];

        const queryUnitKerja = 'SELECT id_unit_kerja FROM unit_kerja WHERE nama_unit = ? LIMIT 1';
        const [unitKerjaResult] = await db.execute(queryUnitKerja, [unit_kerja]);

        if (unitKerjaResult.length === 0) {
            return res.status(404).json({ message: 'Unit kerja tidak ditemukan' });
        }

        const id_unit_kerja = unitKerjaResult[0].id_unit_kerja;
        console.log("Dapat ID Unit Kerja:", id_unit_kerja);

        const queryAnggota1 = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggota1Result] = await db.execute(queryAnggota1, [anggota1]);

        if (anggota1Result.length === 0) {
            return res.status(404).json({ message: 'Anggota1 tidak ditemukan' });
        }

        const id_anggota_1 = anggota1Result[0].id_anggota;
        console.log("Dapat ID Anggota1:", id_anggota_1);

        let id_anggota_2 = null;
        if (anggota2 && anggota2.trim() !== "") {
            const queryAnggota2 = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
            const [anggota2Result] = await db.execute(queryAnggota2, [anggota2]);

            if (anggota2Result.length === 0) {
                return res.status(404).json({ message: 'Anggota2 tidak ditemukan' });
            }

            id_anggota_2 = anggota2Result[0].id_anggota;
            console.log("Dapat ID Anggota2:", id_anggota_2);
        } else {
            console.log("Anggota2 kosong, lanjut tanpa data ini.");
        }

        const queryPatroli = 'SELECT id_patroli FROM patroli WHERE nomor_patroli = ? LIMIT 1';
        const [patroliResult] = await db.execute(queryPatroli, [patroli]);

        if (patroliResult.length === 0) {
            return res.status(404).json({ message: 'Nomor patroli tidak ditemukan' });
        }

        const id_patroli = patroliResult[0].id_patroli;
        console.log("Dapat ID Patroli:", id_patroli);

        return res.json({
            message: 'Login berhasil',
            id_unit,
            nama_unit,
            id_unit_kerja,
            anggota1,
            anggota2: anggota2 || null,
            id_patroli
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

        const query = `SELECT nama_anggota FROM anggota WHERE nama_anggota LIKE ? LIMIT 3`;
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