import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";
const JWT_EXPIRES_IN = "24h";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Password hashing functions
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT functions
export const generateJWT = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Check if JWT is expired
export const isJWTExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  return Date.now() >= decoded.exp * 1000;
};
