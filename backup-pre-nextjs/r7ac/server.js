document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const status = document.getElementById('status');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', handleFiles);

    // Handle form submission
    uploadForm.addEventListener('submit', handleSubmit);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('hover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('hover');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        handleFiles();
    }

    function handleFiles() {
        const file = fileInput.files[0];
        if (file) {
            status.textContent = `Selected file: ${file.name}`;
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const file = fileInput.files[0];
        
        if (!file) {
            status.textContent = 'Please select a file first.';
            return;
        }

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            status.textContent = 'Please select an Excel file (.xlsx or .xls)';
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', file);

        try {
            progressBar.style.display = 'block';
            status.textContent = 'Converting...';

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    progress.style.width = percentCompleted + '%';
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Create and trigger download of JSON file
            const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.name.replace(/\.(xlsx|xls)$/, '.json');
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            status.textContent = 'Conversion completed! JSON file downloaded.';
        } catch (error) {
            console.error('Error:', error);
            status.textContent = 'Error during conversion. Please try again.';
        } finally {
            progress.style.width = '0%';
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 1000);
        }
    }
});
