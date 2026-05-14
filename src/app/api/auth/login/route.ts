import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { login, setSessionCookie, signSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("invalid_request", "Validation failed", 422);

  const user = await login(parsed.data.email, parsed.data.password);
  if (!user) return apiError("invalid_credentials", "Email or password is incorrect", 401);

  const token = await signSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });
  await setSessionCookie(token);
  return apiOk({ tenant: { id: user.tenantId, slug: user.tenant.slug } });
}
