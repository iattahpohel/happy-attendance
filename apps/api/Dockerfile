FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api...
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN pnpm prisma generate && pnpm build
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
# Chạy migration rồi start API
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
