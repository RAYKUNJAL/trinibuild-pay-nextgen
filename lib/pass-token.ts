import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.PASS_SIGNING_SECRET);

export type PassClaims = {
  passId: string;
  eventId: string;
  code: string;
};

export async function signPassToken(claims: PassClaims, ttlSec = 60 * 60 * 24 * 90): Promise<string> {
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec)
    .setIssuer("wefetepass")
    .sign(secret);
}

export async function verifyPassToken(token: string): Promise<PassClaims> {
  const { payload } = await jwtVerify(token, secret, { issuer: "wefetepass" });
  return { passId: String(payload.passId), eventId: String(payload.eventId), code: String(payload.code) };
}
