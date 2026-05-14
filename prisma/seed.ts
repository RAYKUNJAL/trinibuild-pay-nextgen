import { PrismaClient, TenantTier, TenantStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Fintech Ltd",
      tier: TenantTier.API_LICENSING,
      status: TenantStatus.ACTIVE,
      country: "TT",
      currency: "TTD",
    },
  });

  const passwordHash = await bcrypt.hash("demo-password-123", 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "owner@demo.test" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "owner@demo.test",
      name: "Demo Owner",
      passwordHash,
      role: UserRole.OWNER,
    },
  });

  const existing = await prisma.apiKey.findFirst({ where: { tenantId: tenant.id } });
  if (!existing) {
    const raw = `cc_test_${crypto.randomBytes(24).toString("hex")}`;
    const hash = await bcrypt.hash(raw, 10);
    await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        name: "Seed key",
        prefix: raw.slice(0, 12),
        hash,
      },
    });
    console.log("Seed API key (store this, won't be shown again):", raw);
  }

  console.log("Seed complete. Tenant:", tenant.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
