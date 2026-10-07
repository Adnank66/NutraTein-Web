import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      {
        status: "ERROR",
        message: "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in .env",
      },
      { status: 500 }
    )
  }

  try {
    const supabase = createSupabaseClient(url, key)

    // 1. Check test_connection table
    const { data, error } = await supabase
      .from("test_connection")
      .select("*")
      .limit(1)

    if (error) {
      return NextResponse.json({
        status: "ERROR",
        endpoint: url,
        table: "test_connection",
        supabaseError: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
        instruction:
          "To enable this test, run the SQL script in your Supabase SQL Editor to create the 'test_connection' table.",
      })
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: "NUTRATEIN → Supabase → PostgreSQL connection is working.",
      endpoint: url,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({
      status: "ERROR",
      message: err.message,
    })
  }
}
