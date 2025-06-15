document.getElementById('cvFile').addEventListener('change', function () {
    const file = this.files[0];
    const display = document.getElementById('fileNameDisplay');
    display.textContent = file ? `Selected file: ${file.name}` : '';
});

async function getData() {
    const prompt = document.getElementById('userPrompt').value;
    const file = document.getElementById('cvFile').files[0];
    const output = document.getElementById('output');
    const loading = document.getElementById('loading');
    const responseContainer = document.getElementById('responseContainer');

    if (!prompt || !file) {
        alert('Please enter a prompt and upload your CV.');
        return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('cv', file);

    output.textContent = '';
    responseContainer.style.display = 'none';
    loading.style.display = 'block';

    const res = await fetch('/api/prompt', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    loading.style.display = 'none';
    responseContainer.style.display = 'block';

    output.textContent = data.message;
    document.getElementById('copyBtn').style.display = 'inline-block';
}

function copyOutput() {
    const text = document.getElementById('output').textContent;
    navigator.clipboard.writeText(text);
    document.getElementById('copyMessage').style.display = 'block';
    setTimeout(() => document.getElementById('copyMessage').style.display = 'none', 2000);
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const text = document.getElementById('output').textContent;
    const marginLeft = 10;
    const marginTop = 10;
    const lineHeight = 7;
    const maxLineWidth = 190; // A4 width - margins
    const fontSize = 10;

    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, maxLineWidth);
    doc.text(lines, marginLeft, marginTop + lineHeight);

    doc.save('cover-letter.pdf');
}

const promptInput = document.getElementById('userPrompt');
const fullPlaceholder = "Paste full job description or job post link here...";
let index = 0;

function typePlaceholder() {
    if (index <= fullPlaceholder.length) {
        promptInput.setAttribute("placeholder", fullPlaceholder.slice(0, index));
        index++;
        setTimeout(typePlaceholder, 70); // Adjust speed (lower = faster)
    }
}

// Start animation when page loads
window.addEventListener('DOMContentLoaded', typePlaceholder);

