import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'OTP delivery endpoint is not yet implemented on the backend.'
    },
    { status: 501 }
  );
}


