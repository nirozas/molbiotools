import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Initialize the Gemini API client and Resend
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

import { categories } from '@/data/categories';

// Dynamically extract all internal tools available on MolBioTools
const availableTools = categories.flatMap(cat => 
  cat.subcategories.flatMap(sub => 
    sub.tools.filter(t => t.type === 'internal').map(t => ({
      name: t.name,
      url: t.href,
      description: t.description
    }))
  )
);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: `You are an expert Bioinformatics AI Assistant for MolBioTools.
Your goal is to help users find the right tool for their task.
Here is the list of available tools on MolBioTools:
${JSON.stringify(availableTools, null, 2)}

If the user's request can be solved by one or more of these internal tools, recommend them by providing their EXACT name and url.
If the user's request CANNOT be solved by these tools, recommend external web-based platforms (e.g., NCBI BLAST, Expasy, Benchling, GraphPad Prism, AlphaFold DB, etc.) that can help them.
ALWAYS format your response in JSON matching this schema:
{
  "internalTools": [ { "name": "Tool Name", "url": "/tools/..." } ],
  "externalTools": [ { "name": "External Tool Name", "url": "https://..." } ],
  "message": "A helpful, friendly message explaining your recommendation. Keep it under 2 sentences.",
  "isMissingFeature": boolean (true ONLY if they asked for a bioinformatics tool that MolBioTools lacks, indicating a feature request should be filed)
}
NEVER wrap your JSON response in markdown blocks like \`\`\`json. Return RAW valid JSON only.`
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON out of the response (fallback in case Gemini wraps it in markdown)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const rawJson = jsonMatch ? jsonMatch[1] : text;
    
    const parsedResponse = JSON.parse(rawJson);
    
    // Feature Request / Bug Report Handling
    if (parsedResponse.isMissingFeature) {
      const bugReport = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userPrompt: prompt,
        aiSuggestions: parsedResponse.externalTools,
        status: 'open'
      };

      // 1. Save to local JSON file
      try {
        const filePath = path.join(process.cwd(), 'data', 'bug-reports.json');
        let reports = [];
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf-8');
          reports = JSON.parse(fileData);
        }
        reports.push(bugReport);
        fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
      } catch (e) {
        console.error("Failed to write to local bug-reports.json", e);
      }

      // 2. Send email alert via Resend
      if (resend) {
        try {
          await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: 'niroz.as@example.com', // Replace with your verified email
          subject: 'MolBioTools: New Feature Request / Missing Tool',
          html: `
            <h2>New Feature Request</h2>
            <p><strong>User asked for:</strong> ${prompt}</p>
            <p><strong>AI recommended these external tools:</strong></p>
            <ul>
              ${parsedResponse.externalTools.map((t: any) => `<li><a href="${t.url}">${t.name}</a></li>`).join('')}
            </ul>
            <p><small>View all reports at /admin/bug-handler</small></p>
          `
          });
        } catch (e) {
          console.error("Failed to send Resend email", e);
        }
      } else {
        console.warn("RESEND_API_KEY not set. Skipping email alert.");
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error('Error in AI Finder API:', error);
    return NextResponse.json({ error: 'Failed to process AI request. ' + (error.message || String(error)) }, { status: 500 });
  }
}
