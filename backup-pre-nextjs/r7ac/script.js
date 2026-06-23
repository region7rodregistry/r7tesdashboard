document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileName");
    const convertBtn = document.getElementById("convertBtn");
    const progressBar = document.getElementById("progressBar");
    const progress = document.getElementById("progress");
    const status = document.getElementById("status");

    let selectedFile = null;

    // Handle drag and drop
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("hover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("hover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("hover");

        const file = e.dataTransfer.files[0];
        handleFileSelection(file);
    });

    // Handle file input change
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleFileSelection(file);
    });

    function handleFileSelection(file) {
        if (file && (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel")) {
            selectedFile = file;
            fileNameDisplay.textContent = file.name;
            fileNameDisplay.style.display = "block";
            convertBtn.disabled = false;
            dropZone.classList.remove("error");
        } else {
            fileNameDisplay.textContent = "Invalid file type. Please upload an Excel file.";
            fileNameDisplay.style.display = "block";
            dropZone.classList.add("error");
            convertBtn.disabled = true;
        }
    }

    // Handle form submission
    document.getElementById("uploadForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!selectedFile) {
            status.textContent = "Please select a file to convert.";
            return;
        }

        convertBtn.disabled = true;
        status.textContent = "Converting...";
        progressBar.style.display = "block";
        progress.style.width = "0%";

        try {
            const jsonData = await convertExcelToJson(selectedFile);

            // Display JSON data in the status area
            status.textContent = JSON.stringify(jsonData, null, 2);
            progress.style.width = "100%";
        } catch (error) {
            status.textContent = "An error occurred during conversion.";
            console.error(error);
        } finally {
            convertBtn.disabled = false;
        }
    });

    // Function to convert Excel file to JSON
    async function convertExcelToJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                resolve(jsonData);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
});
