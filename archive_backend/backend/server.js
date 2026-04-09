const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
require('dotenv').config();
const { translateDNA } = require('./translation');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_EMAILS = ['asniroz@gmail.com', 'nirozzas@gmail.com'];
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (!resend) {
    console.warn("WARNING: RESEND_API_KEY is missing. Email notifications will be disabled.");
}

app.use(cors());
app.use(bodyParser.json());

// Admin Authorization Middleware
const adminAuth = (req, res, next) => {
    const adminEmail = req.headers['x-admin-email'];
    if (ADMIN_EMAILS.includes(adminEmail)) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized: Admin access required.' });
    }
};

const mhciAlleles = fs.readFileSync(path.join(__dirname, 'mhci_alleles.txt'), 'utf8').split(/\r?\n/).map(a => a.trim()).filter(Boolean);
const mhciiAlleles = fs.readFileSync(path.join(__dirname, 'mhcii_alleles.txt'), 'utf8').split(/\r?\n/).map(a => a.trim()).filter(Boolean);

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
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const pollRes = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', `jobid=${jobId}&wait=20`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (!pollRes.data.includes("launchcheck('active'")) {
                let $ = cheerio.load(pollRes.data);
                let textResult = $('pre').text();
                // Alternatively they might have a download link, but usually standard text comes in <pre>
                if (textResult && textResult.includes("------------------")) {
                    dtuText = textResult;
                } else {
                    let link = $('a[href$=".txt"]').attr('href');
                    if (link) {
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

app.post('/api/report-bug', async (req, res) => {
    const { email, description, platform } = req.body;
    const bugFile = path.join(__dirname, 'bugs.json');
    
    let bugs = [];
    if (fs.existsSync(bugFile)) {
        bugs = JSON.parse(fs.readFileSync(bugFile, 'utf8'));
    }
    
    const newBug = {
        id: Date.now(),
        email: email || 'anonymous@molbiotools.com',
        description,
        platform: platform || 'Web',
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    bugs.push(newBug);
    fs.writeFileSync(bugFile, JSON.stringify(bugs, null, 2));

    // Send email to admin
    try {
        if (resend) {
            await resend.emails.send({
                from: 'MolBioTools Bugs <onboarding@resend.dev>',
                to: ADMIN_EMAILS,
                subject: `🐞 NEW BUG REPORT: ${newBug.description.substring(0, 30)}...`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #e11d48;">New Bug Reported</h2>
                        <p><strong>Reporter Email:</strong> ${newBug.email}</p>
                        <p><strong>Platform:</strong> ${newBug.platform}</p>
                        <p><strong>Description:</strong></p>
                        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #e11d48;">
                            ${newBug.description}
                        </div>
                    </div>
                `
            });
        } else {
            console.log('Skipping email notification: Resend not configured.');
        }
    } catch (err) {
        console.error('Failed to send bug email:', err);
    }

    res.status(200).json({ success: true, bug: newBug });
});

app.post('/api/submit-tool', async (req, res) => {
    const submission = req.body;
    const submissionFile = path.join(__dirname, 'submissions.json');
    
    let submissions = [];
    if (fs.existsSync(submissionFile)) {
        submissions = JSON.parse(fs.readFileSync(submissionFile, 'utf8'));
    }
    
    const newSubmission = {
        ...submission,
        id: Date.now(),
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    submissions.push(newSubmission);
    fs.writeFileSync(submissionFile, JSON.stringify(submissions, null, 2));

    // Send email to admin
    try {
        if (resend) {
            await resend.emails.send({
                from: 'MolBioTools <onboarding@resend.dev>',
                to: ADMIN_EMAILS,
                subject: `🛠️ NEW TOOL SUBMISSION`,
                html: `<p>New tool submission received. Check submissions.json for details.</p>`
            });
        }
    } catch (err) {
        console.error('Failed to send submission email:', err);
    }

    res.status(200).json({ success: true });
});

app.get('/api/admin/bugs', adminAuth, (req, res) => {
    const bugFile = path.join(__dirname, 'bugs.json');
    if (fs.existsSync(bugFile)) {
        return res.json(JSON.parse(fs.readFileSync(bugFile, 'utf8')));
    }
    res.json([]);
});

app.post('/api/admin/resolve-bug', adminAuth, (req, res) => {
    const { id } = req.body;
    const bugFile = path.join(__dirname, 'bugs.json');
    if (fs.existsSync(bugFile)) {
        let bugs = JSON.parse(fs.readFileSync(bugFile, 'utf8'));
        bugs = bugs.map(b => b.id === id ? { ...b, status: 'resolved' } : b);
        fs.writeFileSync(bugFile, JSON.stringify(bugs, null, 2));
        return res.json({ success: true });
    }
    res.status(404).json({ error: 'Bug not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
