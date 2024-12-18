// import dotenv from 'dotenv';

const app = require('./app.js');

// dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
