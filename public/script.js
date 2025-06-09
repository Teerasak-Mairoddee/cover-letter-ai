async function getData() {
    const prompt = document.getElementById('userPrompt').value;
    const fileInput = document.getElementById('cvFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload a PDF file.');
        return;
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('cv', file);

    const res = await fetch('/api/prompt', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    document.getElementById('output').innerText = data.message;
    document.getElementById('copyBtn').style.display = 'inline-block';
}

function copyOutput() {
    const text = document.getElementById('output').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const msg = document.getElementById('copyMessage');
        msg.style.display = 'block';

        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}
