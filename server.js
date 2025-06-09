const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

// Handle POST request with prompt and CV file
app.post('/api/prompt', upload.single('cv'), async (req, res) => {
    const userPrompt = req.body.prompt;
    const pdfFile = req.file;

    if (!pdfFile) {
        return res.status(400).json({ message: 'PDF CV file is required.' });
    }

    try {
        // Read base prompt and PDF
        const promptText = fs.readFileSync('prompt.txt', 'utf8');
        const pdfBuffer = fs.readFileSync(pdfFile.path);
        const pdfData = await pdfParse(pdfBuffer);
        const pdfText = pdfData.text;

        const combinedPrompt = `
${promptText.trim()}

----- USER PROMPT -----
${userPrompt}

----- CV CONTENT -----
${pdfText.trim()}
        `;

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // or 'gpt-3.5-turbo'
                messages: [{ role: 'user', content: combinedPrompt }],
                temperature: 0.7
            })
        });

        const data = await openaiRes.json();

        // Always remove the uploaded file
        fs.unlinkSync(pdfFile.path);

        if (!openaiRes.ok || !data.choices || !data.choices[0]) {
            return res.status(openaiRes.status || 500).json({
                message: data?.error?.message || 'OpenAI API error or invalid response.'
            });
        }

        res.json({ message: data.choices[0].message.content });

    } catch (err) {
        console.error("Error:", err);
        if (pdfFile?.path) fs.unlink(pdfFile.path, () => { });
        res.status(500).json({ message: 'Internal server error.', error: err.message });
    }
});

// Listen on 0.0.0.0 to support reverse proxy via Apache
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
