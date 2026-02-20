import { NextResponse } from "next/server";
import { SyncOrchestrator } from "@/lib/sync";

export async function GET() {
  try {
    const result = await SyncOrchestrator.sincronizarCompleto(
      "141f9441-b7b3-4bf8-b2b8-79d332840410",
      false
    );
    return NextResponse.json({
      result,
      env: {
        user: process.env.WORDPRESS_USERNAME,
        passLength: process.env.WORDPRESS_APPLICATION_PASSWORD?.length || 0,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
