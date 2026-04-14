FROM node:22-slim

# System deps (minimal — Peti is text-only, no ffmpeg/chromium/poppler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# App directory
WORKDIR /app

# Copy agent-runner source + heartbeat
COPY agent-runner/package.json agent-runner/tsconfig.json ./agent-runner/
COPY agent-runner/src/ ./agent-runner/src/

# Install Claude CLI globally (Agent SDK spawns it as a subprocess)
RUN npm install -g @anthropic-ai/claude-code

# Install agent-runner deps and compile
RUN cd agent-runner && npm install && npx tsc

# Root package.json (for future heartbeat etc.)
COPY package.json tsconfig.json ./
RUN npm install 2>/dev/null || true

# Workspace directories (mounted at runtime)
RUN mkdir -p /workspace/user /workspace/agent /home/node/.claude \
    && chown -R node:node /workspace /home/node/.claude

# Non-root user
USER node

# Working directory for the agent
WORKDIR /workspace/user

# Entrypoint
COPY --chown=node:node entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
