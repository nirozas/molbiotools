const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');

async function testDTU_I() {
    const form = new FormData();
    form.append('configfile', '/var/www/html/services/NetMHCpan-4.1/webface.cf');
    form.append('SEQPASTE', 'MKNLSQYLIFLIFGLLLFPLQANLSQYLIFLIFGLL');
    form.append('allele', 'HLA-A02:01');
    form.append('len', '9'); 

    console.log("Submitting I...");
    const res = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', form, { headers: form.getHeaders() });
    
    let m = res.data.match(/jobid=([^'"]+)/i);
    let jobId = m ? m[1] : null;
    console.log("Job I:", jobId);
    if (!jobId) {
        console.log("Error response:", res.data);
        return;
    }
    
    for(let i=0; i<30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const res2 = await axios.post('https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi', `jobid=${jobId}&wait=20`, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
        
        if(!res2.data.includes("launchcheck('active'")) {
            console.log("Finished I!");
            console.log(res2.data.substring(0, 2000));
            break;
        } else {
            console.log("Polling I...");
        }
    }
}
testDTU_I();
