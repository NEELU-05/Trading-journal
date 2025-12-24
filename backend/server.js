require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const tradesRouter = require('./routes/trades');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/trades', tradesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Trading Journal API is running' });
});

// Serve static files from the React frontend app in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from frontend build
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`Serving frontend from: ${path.join(__dirname, '../frontend/dist')}`);
    } else {
        console.log(`API available at http://localhost:${PORT}/api`);
    }
});
