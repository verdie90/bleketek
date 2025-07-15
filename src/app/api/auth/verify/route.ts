import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyJWT } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Token tidak valid" },
        { status: 401 }
      );
    }

    // Fetch fresh user data from Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", payload.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as any;
    const userWithId = { ...userData, id: userDoc.id };

    // Check if user is still active
    if (!userData.isActive) {
      return NextResponse.json(
        { success: false, error: "Akun tidak aktif" },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userResponse } = userWithId;

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
