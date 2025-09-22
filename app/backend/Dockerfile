FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY ../.. /workspace

RUN npm install --workspaces --omit=dev

WORKDIR /workspace/app/backend
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /workspace/app/backend/dist ./dist
COPY --from=base /workspace/app/backend/package.json ./package.json
COPY --from=base /workspace/node_modules ./node_modules
COPY --from=base /workspace/app/backend/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
