import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const clearCookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      expires: new Date(0),
      path: "/",
    };

    cookieStore.set("session_token", "", clearCookie);
    cookieStore.set("refresh_token", "", clearCookie);
    cookieStore.set("user_role", "", clearCookie);

    return NextResponse.json(
      { message: "Signed out successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during sign out:", error);

    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
