// fetch.js

// Function to fetch data from the JSON URL
async function fetchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/kanereroma2343/r7tesdata/refs/heads/main/r7ac/data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        displayData(data);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

// Function to display data in the table
function displayData(data) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    // Filter and iterate over the data to insert rows in the table
    data.slice(4).forEach(row => {
        if (row['B'] || row['C'] || row['G'] || row['I'] || row['J'] || row['K'] || row['L'] || row['M']) { // Ensure row is not empty
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Province">${row['B'] || ''}</td>
                <td data-label="Assessment Center">${row['C'] || ''}</td>
                <td data-label="Center Manager">${row['G'] || ''}</td>
                <td data-label="Sector">${row['I'] || ''}</td>
                <td data-label="Qualification">${row['J'] || ''}</td>
                <td data-label="Accreditation Number">${row['K'] || ''}</td>
                <td data-label="Date of Accreditation">${row['L'] || ''}</td>
                <td data-label="Validity">${row['M'] || ''}</td>
            `;
            tableBody.appendChild(tr);
        }
    });
}

// Call fetchData on page load
window.addEventListener('load', fetchData);
