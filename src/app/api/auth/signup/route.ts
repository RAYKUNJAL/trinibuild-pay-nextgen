import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { setSessionCookie, signSession, signupOrganization } from "@/lib/auth";

export const dynamic = "force-dynamic";

const Body = z.object({
  organizationName: z.string().min(2).max(80),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/, "lowercase, digits, hyphens; 3-40 chars"),
  email: z.string().email(),
  password: z.string().min(10).max(128),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("invalid_request", "Validation failed", 422, {
      details: parsed.error.flatten(),
    });
  }
  try {
    const { tenant, user } = await signupOrganization(parsed.data);
    const token = await signSession({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);
    return apiOk({ tenant: { id: tenant.id, slug: tenant.slug } }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    return apiError("signup_failed", msg, 409);
  }
}
