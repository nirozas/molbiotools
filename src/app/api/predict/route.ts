import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Allow up to 10 minutes for this route (long DTU polling)
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const DTU_URL = "https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi";
const DTU_RESULT_BASE = "https://services.healthtech.dtu.dk";

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { cache: "no-store" });
    return res.text();
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sequence, mhcClass, lengths, alleles, strongThreshold, weakThreshold } = body;

        // ── Build form payload ──────────────────────────────────────────────
        const form = new URLSearchParams();
        if (mhcClass === "I") {
            form.set("configfile", "/var/www/html/services/NetMHCpan-4.1/webface.cf");
            if (lengths) form.set("len", lengths);
        } else {
            form.set("configfile", "/var/www/html/services/NetMHCIIpan-4.3/webface.cf");
        }
        form.set("SEQPASTE", sequence);
        form.set("allele", Array.isArray(alleles) ? alleles.join(",") : alleles);
        form.set("thrs", String(strongThreshold));
        form.set("thrw", String(weakThreshold));

        // ── Submit job ────────────────────────────────────────────────────
        const submitRes = await fetch(DTU_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form.toString(),
            cache: "no-store",
        });
        const submitHtml = await submitRes.text();

        const jobMatch = submitHtml.match(/jobid=([^'"&\s]+)/i);
        const jobId = jobMatch?.[1];
        if (!jobId) {
            console.error("DTU submit response:", submitHtml.substring(0, 500));
            return NextResponse.json(
                { error: "Could not extract DTU Job ID. Service may be busy or input invalid." },
                { status: 502 }
            );
        }

        console.log(`[MHC] Job submitted: ${jobId}`);

        // ── Poll for result (up to ~9.5 min: 114 tries × 5 s) ─────────────
        let dtuText: string | null = null;

        for (let i = 0; i < 114; i++) {
            await sleep(5000);

            const pollBody = new URLSearchParams({ jobid: jobId, wait: "20" });
            const pollRes = await fetch(DTU_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: pollBody.toString(),
                cache: "no-store",
            });
            const pollHtml = await pollRes.text();

            if (!pollHtml.includes("launchcheck('active'")) {
                console.log(`[MHC] Job ${jobId} finished after ${(i + 1) * 2}s`);
                const $ = cheerio.load(pollHtml);
                const preText = $("pre").text();

                if (preText && preText.includes("------------------")) {
                    dtuText = preText;
                } else {
                    const txtLink = $('a[href$=".txt"]').attr("href");
                    if (txtLink) {
                        console.log(`[MHC] Downloading result file: ${txtLink}`);
                        dtuText = await fetchText(DTU_RESULT_BASE + txtLink);
                    } else {
                        dtuText = pollHtml;
                    }
                }
                break;
            }

            if (i % 5 === 0) console.log(`[MHC] Polling ${jobId}... (${i * 2}s)`);
        }

        if (!dtuText || dtuText.includes("launchcheck('active'")) {
            return NextResponse.json(
                { error: "DTU API timed out or returned no data. Try fewer alleles or a shorter sequence." },
                { status: 504 }
            );
        }

        // ── Parse result lines ─────────────────────────────────────────────
        const peptides: object[] = [];
        const lines = dtuText.split("\n");

        for (const line of lines) {
            const trimmed = line.trim();
            if (!/^\d+\s+/.test(trimmed)) continue;

            const parts = trimmed.split(/\s+/);
            const pos = parseInt(parts[0]);
            const allele = parts[1];
            const peptide = parts[2];

            let seqIdx = parts.indexOf("Sequence");
            if (seqIdx === -1) seqIdx = parts.indexOf("pep");
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
                    rank,
                    binder_level: binderLevel,
                    allele,
                });
            }
        }

        return NextResponse.json({ original_sequence: sequence, peptides });
    } catch (err: any) {
        console.error("[MHC predict error]", err);
        return NextResponse.json(
            { error: "Prediction failed: " + (err.message ?? "Unknown error") },
            { status: 500 }
        );
    }
}
