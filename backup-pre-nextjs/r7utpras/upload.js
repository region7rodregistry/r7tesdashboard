const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Enable file upload middleware
app.use(fileUpload());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle file upload
app.post('/upload', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
        if (!req.files || !req.files.file) {
            throw new Error('No file uploaded');
        }

        const uploadedFile = req.files.file;

        // Validate file content is JSON
        try {
            JSON.parse(uploadedFile.data.toString());
        } catch (e) {
            throw new Error('Invalid JSON format');
        }

        // Save to data2.json
        await fs.writeFile(
            path.join(__dirname, 'data2.json'),
            uploadedFile.data
        );

        res.json({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 