import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const readAllelesFromFile = (filename: string): string[] => {
    try {
        const filePath = path.join(process.cwd(), "public", filename);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return [];
        }
        return fs
            .readFileSync(filePath, "utf8")
            .split(/\r?\n/)
            .map((a) => a.trim())
            .filter(Boolean);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err);
        return [];
    }
};

export async function GET(req: NextRequest) {
    const mhcClass = req.nextUrl.searchParams.get("mhcClass");

    if (mhcClass === "I") {
        const alleles = readAllelesFromFile("mhci_alleles.txt");
        return NextResponse.json(alleles);
    }
    if (mhcClass === "II") {
        const alleles = readAllelesFromFile("mhcii_alleles.txt");
        return NextResponse.json(alleles);
    }

    return NextResponse.json({
        mhci: readAllelesFromFile("mhci_alleles.txt"),
        mhcii: readAllelesFromFile("mhcii_alleles.txt"),
    });
}
