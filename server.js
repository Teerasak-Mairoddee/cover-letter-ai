const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// Multer for file upload handling
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

// Route: Handle prompt + CV upload
app.post('/api/prompt', upload.single('cv'), async (req, res) => {
    const userPrompt = req.body.prompt;
    const pdfFile = req.file;

    if (!pdfFile) {
        return res.status(400).json({ message: 'PDF CV file is required.' });
    }

    try {
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
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: combinedPrompt }],
                temperature: 0.7
            })
        });

        const data = await openaiRes.json();

        // Clean up uploaded file
        fs.unlinkSync(pdfFile.path);

        if (!openaiRes.ok) {
            return res.status(openaiRes.status).json({ message: data.error?.message || 'OpenAI API error' });
        }

        res.json({ message: data.choices?.[0]?.message?.content || 'No response from OpenAI' });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: 'Something went wrong.', error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
