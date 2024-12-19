
const cors = require("cors");
const express = require("express");

const degreeRoutes = require('./routes/degreeRoutes')
const userRoutes = require('./routes/userRouter')
const eventRoutes = require('./routes/eventRouter')
const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/api/degree', degreeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/event',eventRoutes);

// Default Route
app.get('/', (req, res) => res.send('API is running!'));
app.use(cors()); 

module.exports = app;