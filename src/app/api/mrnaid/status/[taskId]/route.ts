import { NextRequest, NextResponse } from "next/server";

const MRNAID_BASE = "https://mrnaid.dichlab.org";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;
    const response = await fetch(`${MRNAID_BASE}/api/v1/status/${taskId}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Poll failed: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
