import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyPassword, generateJWT } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // Query user from Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Email tidak ditemukan" },
        { status: 401 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as any;
    const userWithId = { ...userData, id: userDoc.id };

    // Check if user is active
    if (!userData.isActive) {
      return NextResponse.json(
        { success: false, error: "Akun tidak aktif. Hubungi administrator." },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await verifyPassword(
      password,
      userData.password || ""
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Password salah" },
        { status: 401 }
      );
    }

    // Update last login
    await updateDoc(doc(db, "users", userDoc.id), {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Generate JWT token
    const token = generateJWT({
      userId: userWithId.id,
      email: userData.email,
      role: userData.role,
    });

    // Log login activity
    await addDoc(collection(db, "activity_logs"), {
      userId: userWithId.id,
      action: "login",
      details: `User ${userData.email} logged in`,
      timestamp: serverTimestamp(),
      ipAddress: "unknown", // Can be enhanced with real IP detection
    });

    // Remove password from response
    const { password: _, ...userResponse } = userWithId;

    return NextResponse.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
