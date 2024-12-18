const express = require("express");

const degreeRoutes = require('./routes/degreeRoutes')
const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/api', degreeRoutes);

// Default Route
app.get('/', (req, res) => res.send('API is running!'));


module.exports = app;