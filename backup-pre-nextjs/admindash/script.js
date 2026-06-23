// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3306;

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'admindash'); // Save to the admindash directory
    },
    filename: (req, file, cb) => {
        cb(null, 'data.json'); // Save as data.json
    }
});

const upload = multer({ storage });

// Serve static files from the admindash directory
app.use(express.static('admindash'));

// Endpoint to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    res.send('File uploaded successfully!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});