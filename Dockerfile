# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder: install workspace deps and bundle the Lambda entry point
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy lockfile + every workspace manifest first so `npm ci` is cached
COPY package.json package-lock.json ./
COPY packages/api-server/package.json   packages/api-server/package.json
COPY packages/ai-engine/package.json    packages/ai-engine/package.json
COPY packages/jira-client/package.json  packages/jira-client/package.json

RUN npm ci --no-audit --no-fund

# Now copy sources and bundle. The Lambda container base image does NOT ship
# AWS SDK v3 (unlike the zip runtime), so we bundle everything — no externals.
COPY tsconfig.json ./
COPY packages ./packages

RUN ./node_modules/.bin/esbuild packages/api-server/src/lambda.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=cjs \
      --outfile=dist/lambda.js

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime: AWS Lambda Node.js 20 image, handler = lambda.handler
# ─────────────────────────────────────────────────────────────────────────────
FROM public.ecr.aws/lambda/nodejs:20

# Bundled API + Lambda handler
COPY --from=builder /build/dist/lambda.js ${LAMBDA_TASK_ROOT}/lambda.js

# Static UI (served by the same Lambda at /, /index.html, /advanced.html, /config.js)
COPY apps/release-planner-ui ${LAMBDA_TASK_ROOT}/apps/release-planner-ui

# Local calendar fallback (used when DYNAMODB_TABLE is not set — handy for smoke tests)
COPY data/generated-calendar-2026.json ${LAMBDA_TASK_ROOT}/data/generated-calendar-2026.json

CMD [ "lambda.handler" ]
