import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const parseLines = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((a) => a.trim())
        .filter((a) => Boolean(a) && !a.startsWith("<"));

const readAllelesFromFile = async (filename: string, reqUrl: string): Promise<string[]> => {
    try {
        const filePath = path.join(process.cwd(), "public", filename);
        if (fs.existsSync(filePath)) {
            return parseLines(fs.readFileSync(filePath, "utf8"));
        }
    } catch (err) {
        console.error(`Error reading ${filename} from disk:`, err);
    }

    // Fallback for edge/serverless runtimes (e.g. Cloudflare Workers) where public/ lives in static assets
    try {
        const assetUrl = new URL(`/${filename}`, reqUrl).toString();
        const res = await fetch(assetUrl, { cache: "no-store" });
        const ct = res.headers.get("content-type") || "";
        if (res.ok && !ct.includes("text/html")) {
            return parseLines(await res.text());
        }
    } catch (err) {
        console.error(`Error fetching static asset ${filename}:`, err);
    }

    return [];
};

export async function GET(req: NextRequest) {
    const mhcClass = req.nextUrl.searchParams.get("mhcClass");

    if (mhcClass === "I") {
        const alleles = await readAllelesFromFile("mhci_alleles.txt", req.url);
        return NextResponse.json(alleles);
    }
    if (mhcClass === "II") {
        const alleles = await readAllelesFromFile("mhcii_alleles.txt", req.url);
        return NextResponse.json(alleles);
    }

    const [mhci, mhcii] = await Promise.all([
        readAllelesFromFile("mhci_alleles.txt", req.url),
        readAllelesFromFile("mhcii_alleles.txt", req.url),
    ]);
    return NextResponse.json({ mhci, mhcii });
}
