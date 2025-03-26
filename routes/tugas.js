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

// // Endpoint untuk mengupdate status tugas
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

// Endpoint untuk menyimpan rekap jika tugas selesai
router.put('/rekap-selesai/:id_tugas', async(req, res) => {
    try {
        const idTugas = req.params.id_tugas;
        const { id_riwayat, nama_anggota } = req.body;
        const { tanggal, jam } = getFormattedDateTime(new Date());
        const idStatus = 2;

        if (!id_riwayat || !nama_anggota) {
            return res.status(400).json({ message: 'ID riwayat dan nama anggota harus disertakan' });
        }

        // Konversi id_riwayat ke integer
        const idRiwayat = parseInt(id_riwayat, 10);
        if (isNaN(idRiwayat)) {
            return res.status(400).json({ message: 'ID riwayat tidak valid' });
        }

        // Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }
        const idAnggota = anggotaResult[0].id_anggota;

        // Update atau insert data ke detail_riwayat_luar
        const updateQuery = `
            UPDATE detail_riwayat_luar 
            SET id_status = ?, tanggal_selesai = ?, jam_selesai = ?, id_anggota = ?, id_riwayat = ? 
            WHERE id_tugas = ?`;
        const [updateResults] = await db.execute(updateQuery, [idStatus, tanggal, jam, idAnggota, idRiwayat, idTugas]);

        if (updateResults.affectedRows === 0) {
            const insertQuery = `
                INSERT INTO detail_riwayat_luar 
                (id_tugas, id_status, tanggal_selesai, jam_selesai, id_anggota, id_riwayat) 
                VALUES (?, ?, ?, ?, ?, ?)`;
            await db.execute(insertQuery, [idTugas, idStatus, tanggal, jam, idAnggota, idRiwayat]);
        }

        res.json({ message: 'Rekap tugas selesai berhasil diperbarui' });
    } catch (err) {
        console.error('Error mengupdate rekap selesai:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});

// Endpoint untuk menyimpan rekap jika tugas tidak aman
router.put('/rekap-tidak-aman/:id_tugas', async(req, res) => {
    try {
        const idTugas = req.params.id_tugas;
        const { id_riwayat, nama_anggota, keterangan, id_status } = req.body;
        const { tanggal, jam } = getFormattedDateTime(new Date());

        if (!id_riwayat || !nama_anggota || !id_status) {
            return res.status(400).json({ message: 'ID riwayat, nama anggota, dan id_status harus disertakan' });
        }

        // Konversi id_riwayat ke integer
        const idRiwayat = parseInt(id_riwayat, 10);
        if (isNaN(idRiwayat)) {
            return res.status(400).json({ message: 'ID riwayat tidak valid' });
        }

        // Ambil id_anggota berdasarkan nama_anggota
        const queryAnggota = 'SELECT id_anggota FROM anggota WHERE nama_anggota = ? LIMIT 1';
        const [anggotaResult] = await db.execute(queryAnggota, [nama_anggota]);

        if (anggotaResult.length === 0) {
            return res.status(404).json({ message: 'Anggota tidak ditemukan' });
        }
        const idAnggota = anggotaResult[0].id_anggota;

        // Update atau insert data ke detail_riwayat_luar
        const updateQuery = `
            UPDATE detail_riwayat_luar 
            SET id_status = ?, tanggal_gagal = ?, jam_gagal = ?, keterangan_masalah = COALESCE(keterangan_masalah, ?), 
            id_anggota = ?, id_riwayat = ? 
            WHERE id_tugas = ?`;
        const [updateResults] = await db.execute(updateQuery, [id_status, tanggal, jam, keterangan, idAnggota, idRiwayat, idTugas]);

        if (updateResults.affectedRows === 0) {
            const insertQuery = `
                INSERT INTO detail_riwayat_luar 
                (id_tugas, id_status, tanggal_gagal, jam_gagal, keterangan_masalah, id_anggota, id_riwayat) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            await db.execute(insertQuery, [idTugas, id_status, tanggal, jam, keterangan, idAnggota, idRiwayat]);
        }

        res.json({ message: 'Rekap tugas tidak aman berhasil diperbarui' });
    } catch (err) {
        console.error('Error menyimpan rekap tidak aman:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
});


// Endpoint untuk mengambil rekap tugas
router.get('/rekap/:id_tugas', async(req, res) => {
    try {
        const idTugas = req.params.id_tugas;
        const query = `SELECT id_status, tanggal_selesai, jam_selesai, tanggal_gagal, jam_gagal, keterangan_masalah FROM detail_riwayat_luar WHERE id_tugas = ?`;

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

router.get('/detail_riwayat/:id_unit', async(req, res) => {
    try {
        const idUnit = req.params.id_unit;
        console.log("🟡 [DEBUG] id_unit diterima di API:", idUnit);

        if (!idUnit) {
            console.error("❌ [ERROR] id_unit tidak dikirim!");
            return res.status(400).json({ message: "id_unit tidak boleh kosong!" });
        }

        const query = `
            SELECT dr.id_rekap, dr.id_tugas, tu.nama_tugas, s.nama_status, 
                   dr.keterangan_masalah, 
                   DATE_FORMAT(dr.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
                   TIME_FORMAT(dr.jam_selesai, '%H:%i:%s') AS jam_selesai
            FROM detail_riwayat_luar dr
            JOIN tugas_unit tu ON dr.id_tugas = tu.id_tugas
            JOIN status s ON dr.id_status = s.id_status
            WHERE tu.id_unit = ?
            ORDER BY dr.id_rekap ASC
        `;

        console.log("🔵 [DEBUG] Menjalankan query dengan id_unit:", idUnit);

        const [results] = await db.execute(query, [idUnit]);

        if (results.length > 0) {
            console.log("✅ [SUCCESS] Data ditemukan:", results);
            res.json(results);
        } else {
            console.warn("⚠️ [WARNING] Tidak ada riwayat ditemukan untuk unit ini");
            res.status(404).json({ message: "Tidak ada riwayat ditemukan untuk unit ini" });
        }
    } catch (err) {
        console.error("🔥 [ERROR] Terjadi kesalahan saat mengambil detail riwayat:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});


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

module.exports = router;