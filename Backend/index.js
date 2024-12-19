const express = require('express');
const connectToMongodb = require('./db');

const app = express();
const port = 2000;

// Connect to MongoDB
connectToMongodb();

// Middleware
app.use(express.json());

// Routes
app.use('/api/crops', require('./routes/agro_data.js'));
app.use('/api/diseases', require('./routes/disease_data.js'));

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the homepage!');
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
