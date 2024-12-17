const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.json());

// Import routes 
const userRouter = require('./routes/User.router')
const degreeRouter = require('./routes/Degree.router')


// Use routes 
app.use('/api/user', userRouter)
app.use('/api/degree',degreeRouter)

app.get("/", (req, res) => {
  res.send("Welcome to Zions API");
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
