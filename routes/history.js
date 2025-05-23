const express = require("express");
const router = express.Router();
const db = require("../db"); // Import koneksi database

router.get("/history-patroli-dalam/rekap", async (req, res) => {
  try {
    const query = `
            SELECT id_riwayat, bagian, keterangan_masalah, 
                   DATE_FORMAT(tanggal_selesai, '%d-%m-%Y') AS tanggal_selesai, 
                   jam_selesai
            FROM detail_riwayat_dalam
            ORDER BY id_riwayat DESC, id_rekap DESC;
        `;
    const [results] = await db.execute(query);

    console.log("📊 Query Results:", results); // Debugging

    res.json({ success: true, data: results }); // Pastikan selalu mengembalikan data
  } catch (err) {
    console.error("❌ Error saat mengambil rekap patroli dalam:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

router.get("/history-detail-luar", async (req, res) => {
  try {
    const query = `
            SELECT dr.id_riwayat, dr.id_tugas, tu.nama_tugas, s.nama_status, 
                   dr.keterangan_masalah, dr.id_unit, u.nama_unit,
                   DATE_FORMAT(dr.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
                   TIME_FORMAT(dr.jam_selesai, '%H:%i:%s') AS jam_selesai
            FROM detail_riwayat_luar dr
            JOIN tugas_unit tu ON dr.id_tugas = tu.id_tugas
            JOIN status s ON dr.id_status = s.id_status
            JOIN unit u ON dr.id_unit = u.id_unit  -- 🔹 JOIN untuk ambil nama_unit
            ORDER BY dr.id_riwayat ASC
        `;

    console.log("🔵 [DEBUG] Menjalankan query dengan id_riwayat, id_unit, dan nama_unit");

    const [results] = await db.execute(query);

    if (results.length > 0) {
      console.log("✅ [SUCCESS] Data ditemukan:", results);
      res.json(results);
    } else {
      console.warn("⚠️ [WARNING] Tidak ada riwayat ditemukan");
      res.status(404).json({ message: "Tidak ada riwayat ditemukan" });
    }
  } catch (err) {
    console.error("🔥 [ERROR] Terjadi kesalahan saat mengambil detail riwayat:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// Endpoint untuk menerima data sinkronisasi dari aplikasi Flutter
router.post("/save", async (req, res) => {
  const dataList = req.body;

  if (!Array.isArray(dataList)) {
    return res.status(400).json({ success: false, message: "Format data tidak valid" });
  }

  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    for (const item of dataList) {
      const { type, data } = item;
      if (!type || !data) continue;

      const tableName = getTableName(type);
      if (!tableName) continue;

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => "?").join(",");

      const query = `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${placeholders})`;
      await conn.execute(query, values);
    }

    await conn.commit();
    conn.release();
    res.json({ success: true, message: "Sinkronisasi berhasil" });
  } catch (err) {
    console.error("❌ Gagal sinkronisasi:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server saat sinkronisasi" });
  }
});

// Mapping tipe ke nama tabel
function getTableName(type) {
  switch (type) {
    case "riwayat_luar":
      return "riwayat_luar";
    case "detail_riwayat_luar":
      return "detail_riwayat_luar";
    case "riwayat_dalam":
      return "riwayat_dalam";
    case "detail_riwayat_dalam":
      return "detail_riwayat_dalam";
    default:
      return null;
  }
}

module.exports = router;
