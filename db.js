const mysql = require('mysql2/promise');
require('dotenv').config(); // Load konfigurasi dari .env

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00', // Gunakan offset UTC // ⬅ Tambahin ini biar waktu otomatis WIB
    dateStrings: true, // ⬅ Supaya datetime disimpan sebagai string, bukan objek
});

// Tes koneksi dengan query sederhana
(async() => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to MariaDB');
        connection.release(); // Lepaskan koneksi kembali ke pool
    } catch (err) {
        console.error('❌ Database connection error:', err);
    }
})();

module.exports = db;