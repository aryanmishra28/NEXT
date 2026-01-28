const mongoose = require('mongoose');

function connectDB() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.warn('MONGO_URI is not defined. Starting server without database connection.');
        // Allow the app to start for non-DB features (e.g., resume analysis)
        return;
    }

    mongoose
        .connect(mongoUri, {})
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err.message);
            console.warn('Continuing without database. Some features may be unavailable.');
            // Do not exit; let the app serve non-DB endpoints.
        });
}

module.exports = connectDB;