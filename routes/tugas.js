const express = require('express');
const router = express.Router();
const db = require('../db'); // Pastikan sudah ada koneksi ke database

// Endpoint untuk mengambil tugas berdasarkan id_unit
router.get('/:id_unit', async(req, res) => {
    try {
        const idUnit = req.params.id_unit;
        const query = `
            SELECT 
                t.id_tugas, 
                t.nama_tugas, 
                s.nama_status
            FROM tugas_unit t
            JOIN status s ON t.id_status = s.id_status
            WHERE t.id_unit = ? 
            ORDER BY t.id_tugas ASC
        `;

        const [results] = await db.execute(query, [idUnit]);
        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(404).json({ message: 'Tidak ada tugas ditemukan untuk unit ini' });
        }
    } catch (err) {
        console.error('Error mengambil tugas:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Endpoint untuk mengupdate status tugas
// router.put('/update-status/:id_tugas', async(req, res) => {
//     try {
//         const idTugas = req.params.id_tugas;
//         const { id_status } = req.body;
//         const query = `UPDATE tugas_unit SET id_status = ? WHERE id_tugas = ?`;

//         const [results] = await db.execute(query, [id_status, idTugas]);
//         if (results.affectedRows > 0) {
//             res.json({ message: 'Status tugas berhasil diperbarui' });
//         } else {
//             res.status(404).json({ message: 'Tugas tidak ditemukan' });
//         }
//     } catch (err) {
//         console.error('Error mengupdate status tugas:', err);
//         res.status(500).json({ message: 'Terjadi kesalahan server' });
//     }
// });

// Fungsi untuk mendapatkan tanggal dan waktu dari objek Date
const getFormattedDateTime = (date) => {
    return {
        tanggal: date.toISOString().split('T')[0],
        jam: date.toTimeString().split(' ')[0]
    };
};

router.put('/rekap-selesai/:id_tugas', async(req, res) => {
    try {
        const idTugas = req.params.id_tugas;
        const { nama_anggota } = req.body;
        const { tanggal, jam } = getFormattedDateTime(new Date());
        const idStatus = 2;

        console.log("Data diterima dari Flutter:", req.body);

        // 🔍 Ambil ID anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;
        console.log("ID Anggota ditemukan:", id_anggota);

        // 🔍 Ambil ID riwayat dan ID unit berdasarkan id_anggota
        const queryRiwayat = `
            SELECT id_riwayat, id_unit FROM riwayat_luar 
            WHERE id_anggota = ? 
            ORDER BY id_riwayat DESC 
            LIMIT 1`;
        const [riwayatResult] = await db.execute(queryRiwayat, [id_anggota]);

        if (riwayatResult.length === 0) {
            return res.status(404).json({ message: 'ID riwayat tidak ditemukan untuk tugas ini' });
        }

        const { id_riwayat, id_unit } = riwayatResult[0];
        console.log("ID Riwayat ditemukan:", id_riwayat, "ID Unit ditemukan:", id_unit);

        // 🔄 UPDATE atau INSERT ke detail_riwayat_luar
        const updateQuery = `UPDATE detail_riwayat_luar 
            SET id_status = ?, tanggal_selesai = ?, jam_selesai = ?, id_anggota = ?, id_unit = ? 
            WHERE id_tugas = ? AND id_riwayat = ?`;
        const [updateResults] = await db.execute(updateQuery, [idStatus, tanggal, jam, id_anggota, id_unit, idTugas, id_riwayat]);

        if (updateResults.affectedRows === 0) {
            const insertQuery = `INSERT INTO detail_riwayat_luar (id_tugas, id_status, tanggal_selesai, jam_selesai, id_anggota, id_riwayat, id_unit) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            await db.execute(insertQuery, [idTugas, idStatus, tanggal, jam, id_anggota, id_riwayat, id_unit]);
        }

        res.json({ message: 'Rekap tugas selesai berhasil diperbarui' });
    } catch (err) {
        console.error('Error mengupdate rekap selesai:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

router.put('/rekap-tidak-aman/:id_tugas', async(req, res) => {
    try {
        const idTugas = req.params.id_tugas;
        const { nama_anggota, keterangan, id_status } = req.body;
        const { tanggal, jam } = getFormattedDateTime(new Date());

        console.log("Data diterima dari Flutter:", req.body);

        if (!nama_anggota || !id_status) {
            return res.status(400).json({ message: 'Nama anggota dan id_status harus disertakan' });
        }

        // 🔍 Cari id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }

        const id_anggota = anggotaResult[0].id_anggota;
        console.log("ID Anggota ditemukan:", id_anggota);

        // 🔍 Cek id_riwayat dan id_unit berdasarkan id_anggota
        const queryRiwayat = `
            SELECT id_riwayat, id_unit FROM riwayat_luar 
            WHERE id_anggota = ? 
            ORDER BY id_riwayat DESC 
            LIMIT 1`;
        const [riwayatResult] = await db.execute(queryRiwayat, [id_anggota]);

        if (riwayatResult.length === 0) {
            return res.status(404).json({ message: 'ID riwayat tidak ditemukan di riwayat_luar' });
        }

        const { id_riwayat, id_unit } = riwayatResult[0];
        console.log("ID Riwayat ditemukan:", id_riwayat, "ID Unit ditemukan:", id_unit);

        // 🔄 UPDATE atau INSERT ke detail_riwayat_luar
        const updateQuery = `UPDATE detail_riwayat_luar 
            SET id_status = ?, tanggal_gagal = ?, jam_gagal = ?, 
                keterangan_masalah = COALESCE(NULLIF(?, ''), keterangan_masalah), 
                id_anggota = ?, id_unit = ? 
            WHERE id_tugas = ? AND id_riwayat = ?`;
        const [updateResults] = await db.execute(updateQuery, [id_status, tanggal, jam, keterangan, id_anggota, id_unit, idTugas, id_riwayat]);

        if (updateResults.affectedRows === 0) {
            const insertQuery = `INSERT INTO detail_riwayat_luar 
                (id_tugas, id_status, tanggal_gagal, jam_gagal, keterangan_masalah, id_anggota, id_riwayat, id_unit) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            await db.execute(insertQuery, [idTugas, id_status, tanggal, jam, keterangan, id_anggota, id_riwayat, id_unit]);
        }

        res.json({ message: 'Rekap tugas tidak aman berhasil diperbarui' });
    } catch (err) {
        console.error('Error menyimpan rekap tidak aman:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});


router.get('/rekap/:id_tugas', async(req, res) => {
    console.log("==> ROUTE 1 dipanggil dengan id_tugas:", req.params.id_tugas);
    try {
        const idTugas = req.params.id_tugas;
        const query = `
            SELECT 
                d.id_status, 
                s.nama_status,  -- Ambil nama status dari tabel status
                d.tanggal_selesai, 
                d.jam_selesai, 
                d.tanggal_gagal, 
                d.jam_gagal, 
                d.keterangan_masalah 
            FROM detail_riwayat_luar d
            JOIN status s ON d.id_status = s.id_status  -- Join ke tabel status
            WHERE d.id_tugas = ?`;

        const [results] = await db.execute(query, [idTugas]);

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Rekap tugas tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error mengambil rekap tugas:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});


router.get('/rekap/:id_tugas/:id_riwayat', async(req, res) => {
    console.log("==> ROUTE 2 dipanggil dengan id_tugas:", req.params.id_tugas);
    try {
        const { id_tugas, id_riwayat } = req.params;
        const query = `
            SELECT id_status, tanggal_selesai, jam_selesai, tanggal_gagal, jam_gagal, keterangan_masalah 
            FROM detail_riwayat_luar 
            WHERE id_tugas = ? AND id_riwayat = ?`;

        const [results] = await db.execute(query, [id_tugas, id_riwayat]);

        if (results.length > 0) {
            console.log("Data dari database:", results[0]); // Debugging
            res.json(results[0]);
        } else {
            console.log("Rekap tugas tidak ditemukan untuk id_tugas:", id_tugas, "dan id_riwayat:", id_riwayat);
            res.status(404).json({ message: 'Rekap tugas tidak ditemukan' });
        }
    } catch (err) {
        console.error('Error mengambil rekap tugas:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

z
// Endpoint untuk mendapatkan id_status_luar berdasarkan id_unit
router.get('/status_data/:id_unit', async(req, res) => {
    try {
        const { id_unit } = req.params;
        const sql = 'SELECT id_status_luar FROM riwayat_luar WHERE id_unit = ?';
        const [rows] = await db.execute(sql, [id_unit]);

        if (rows.length > 0 && rows.some(row => row.id_status_luar == 2)) {
            res.json({ success: true, message: 'Success' });
        } else {
            res.json({ success: false, message: 'Gak Ada Kocak!!!' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
});


router.get('/cek_status_tugas', async(req, res) => {
    const { id_riwayat } = req.query;

    if (!id_riwayat) {
        return res.status(400).json({ message: 'ID riwayat harus diisi' });
    }

    try {
        // Ambil id_unit dari riwayat_luar
        const [unitResult] = await db.execute(
            'SELECT id_unit FROM riwayat_luar WHERE id_riwayat = ? LIMIT 1', [id_riwayat]
        );

        if (unitResult.length === 0) {
            return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
        }

        const id_unit = unitResult[0].id_unit;

        // Cek apakah ada status 3 (ada masalah) atau semua status sudah 2 (selesai)
        const [statusResult] = await db.execute(
            'SELECT id_status FROM detail_riwayat_luar WHERE id_unit = ? AND id_riwayat = ?', [id_unit, id_riwayat]
        );
        console.log('ID Riwayat:', id_riwayat);
        console.log('ID Unit:', id_unit);
        console.log('Hasil Query Status:', statusResult);

        if (statusResult.length === 0) {
            return res.status(400).json({ message: 'Belum ada tugas untuk unit ini' });
        }

        const semuaStatus = statusResult.map(row => row.id_status);

        if (semuaStatus.includes(3)) {
            return res.json({ status: 3 }); // Ada masalah
        } else if (semuaStatus.every(status => status === 2)) {
            return res.json({ status: 2 }); // Semua selesai
        } else {
            return res.json({ status: 1 }); // Masih ada tugas yang belum selesai
        }

    } catch (err) {
        console.error('Error saat cek status:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});


module.exports = router;