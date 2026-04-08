const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { translateDNA } = require('./translation');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const mhciAlleles = fs.readFileSync(path.join(__dirname, 'mhci_alleles.txt'), 'utf8').split('\n').filter(Boolean);
const mhciiAlleles = fs.readFileSync(path.join(__dirname, 'mhcii_alleles.txt'), 'utf8').split('\n').filter(Boolean);

app.get('/api/alleles', (req, res) => {
    const { mhcClass } = req.query;
    if (mhcClass === 'I') return res.json(mhciAlleles);
    if (mhcClass === 'II') return res.json(mhciiAlleles);
    res.json({ mhci: mhciAlleles, mhcii: mhciiAlleles });
});

app.post('/api/translate', (req, res) => {
    const { sequence } = req.body;
    try {
        const translated = translateDNA(sequence);
        res.json({ translated });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/predict', async (req, res) => {
    const { sequence, mhcClass, lengths, alleles, strongThreshold, weakThreshold } = req.body;

    try {
        const form = new FormData();
        if (mhcClass === 'I') {
            form.append('configfile', '/var/www/html/services/NetMHCpan-4.1/webface.cf');
        } else {
            form.append('configfile', '/var/www/html/services/NetMHCIIpan-4.3/webface.cf');
        }
        form.append('SEQPASTE', sequence);
        form.append('allele', alleles.join(','));
        form.append('thrs', strongThreshold.toString());
        form.append('thrw', weakThreshold.toString());

        const submitRes = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', form, { 
            headers: form.getHeaders() 
        });

        let m = submitRes.data.match(/jobid=([^'"]+)/i);
        let jobId = m ? m[1] : null;

        if (!jobId) {
            throw new Error("Could not extract DTU Job ID");
        }

        let dtuText = null;

        // Poll for up to 60 seconds (30 tries)
        for(let i=0; i<30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const pollRes = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', `jobid=${jobId}&wait=20`, { 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            if(!pollRes.data.includes("launchcheck('active'")) {
                let $ = cheerio.load(pollRes.data);
                let textResult = $('pre').text();
                // Alternatively they might have a download link, but usually standard text comes in <pre>
                if (textResult && textResult.includes("------------------")) {
                    dtuText = textResult;
                } else {
                    let link = $('a[href$=".txt"]').attr('href');
                    if(link) {
                        const fileRes = await axios.get('https://services.healthtech.dtu.dk' + link);
                        dtuText = fileRes.data;
                    } else {
                        dtuText = pollRes.data; // fallback parse raw HTML
                    }
                }
                break;
            }
        }

        if (!dtuText) {
            throw new Error("DTU API timed out or returned no text.");
        }

        // Parse result
        const peptides = [];
        const lines = dtuText.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (/^\d+\s+/.test(trimmed)) {
                const parts = trimmed.split(/\s+/);
                const pos = parseInt(parts[0]);
                const allele = parts[1];
                const peptide = parts[2];
                
                let seqIdx = parts.indexOf('Sequence');
                if (seqIdx === -1) seqIdx = parts.indexOf('pep');
                if (seqIdx === -1) continue;
                
                const score = parseFloat(parts[seqIdx + 1]);
                const rank = parseFloat(parts[seqIdx + 2]);
                
                let binderLevel = "";
                if (rank <= strongThreshold) binderLevel = "Strong";
                else if (rank <= weakThreshold) binderLevel = "Weak";
                
                if (binderLevel) {
                    peptides.push({
                        sequence: peptide,
                        start_position: pos,
                        end_position: pos + peptide.length - 1,
                        affinity_score: score.toFixed(4),
                        rank: rank,
                        binder_level: binderLevel,
                        allele: allele
                    });
                }
            }
        }

        res.json({
            original_sequence: sequence,
            peptides: peptides
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to perform prediction via DTU API: ' + error.message });
    }
});

// Tool submission endpoint
app.post('/api/submit-tool', (req, res) => {
    const submission = req.body;
    const submissionFile = path.join(__dirname, 'submissions.json');
    
    let submissions = [];
    if (fs.existsSync(submissionFile)) {
        submissions = JSON.parse(fs.readFileSync(submissionFile, 'utf8'));
    }
    
    submissions.push({
        ...submission,
        id: Date.now(),
        date: new Date().toISOString(),
        status: 'pending'
    });
    
    fs.writeFileSync(submissionFile, JSON.stringify(submissions, null, 2));
    res.status(200).json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
