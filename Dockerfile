# syntax=docker/dockerfile:1.7
# Multi-stage build for WeFetePass (Next.js 15 App Router)
# Final image runs `next start` as non-root user.

###############################################################################
# 1. deps — install production + dev deps needed for `next build`
###############################################################################
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy manifests only so Docker can cache this layer.
COPY package.json package-lock.json* ./

# Peer-dep conflicts exist in this tree; --legacy-peer-deps is required.
RUN npm ci --legacy-peer-deps

###############################################################################
# 2. builder — compile the Next.js app
###############################################################################
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.mjs is NOT in standalone mode; produce a full .next build.
RUN npm run build

###############################################################################
# 3. runner — minimal production image
###############################################################################
FROM node:20-alpine AS runner
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Alpine ships a `node` user (uid 1000) we can reuse.
RUN apk add --no-cache wget \
 && chown -R node:node /app

# Bring in only what's needed to run `next start`.
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/package-lock.json ./package-lock.json
COPY --chown=node:node --from=builder /app/next.config.mjs ./next.config.mjs
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public

USER node

EXPOSE 3000

# `npm start` resolves to `next start` per package.json
CMD ["npm", "start"]
