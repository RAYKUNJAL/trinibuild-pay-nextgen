import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "cc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET env var is missing or too short (need >= 16 chars)");
  }
  return new TextEncoder().encode(value);
}

export type SessionPayload = {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function readSessionFromCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function signupOrganization(input: {
  organizationName: string;
  slug: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.tenant.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error("Workspace slug already taken");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const tenant = await prisma.tenant.create({
    data: {
      slug: input.slug,
      name: input.organizationName,
      users: {
        create: {
          email: input.email,
          passwordHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  const user = tenant.users[0];
  return { tenant, user };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email },
    include: { tenant: true },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}
