const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

async function testDTU() {
    const form = new FormData();
    form.append('configfile', '/var/www/html/services/NetMHCIIpan-4.3/webface.cf');
    form.append('SEQPASTE', 'MKNLSQYLIFLIFGLLLFPLQANLSQYLIFLIFGLL');
    form.append('allele', 'DRB1_0101');

    console.log("Submitting II...");
    const res = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', form, { headers: form.getHeaders() });
    
    let m = res.data.match(/jobid=([^'"]+)/i);
    let jobId = m ? m[1] : null;
    console.log("Job II:", jobId);
    
    if(!jobId) return;

    for(let i=0; i<30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res2 = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', `jobid=${jobId}&wait=20`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
        
        if(!res2.data.includes("launchcheck('active'")) {
            console.log("Finished II!");
            console.log(res2.data.substring(0, 2000).replace(/</g, '<'));
            break;
        } else {
            console.log("Polling II...");
        }
    }
}
testDTU();
