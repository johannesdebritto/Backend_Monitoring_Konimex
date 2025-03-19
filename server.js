const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const tugasRoutes = require('./routes/tugas');
const submitRoutes = require('./routes/submit');
const statusRoutes = require('./routes/status');
const tugasdalamRoutes = require('./routes/tugas_dalam');

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// **Middleware Logging Global (Semua Request)**
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length) {
        console.log('Body:', req.body);
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tugas', tugasRoutes);
app.use('/api/tugas_dalam', tugasdalamRoutes);
app.use('/api/submit', submitRoutes);
app.use('/api/status', statusRoutes);

// Jalankan server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Haloooo Everybodyy Server berjalan di http://0.0.0.0:${PORT}`);
});