<?php
header('Content-Type: application/json');

try {
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $uploadedFile = $_FILES['file'];
    
    // Check for upload errors
    if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $uploadedFile['error']);
    }

    // Validate file type
    $fileContent = file_get_contents($uploadedFile['tmp_name']);
    if (!json_decode($fileContent)) {
        throw new Exception('Invalid JSON format');
    }

    // Save to data2.json
    if (file_put_contents('data2.json', $fileContent) === false) {
        throw new Exception('Failed to save file');
    }

    echo json_encode(['success' => true, 'message' => 'File uploaded successfully']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?> 