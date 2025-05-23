const express = require("express");
const router = express.Router();
const db = require("../db"); // Koneksi database

// Endpoint untuk menerima data sinkronisasi dari aplikasi Flutter
router.post("/sync", async (req, res) => {
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
