#!/bin/bash
# Peti container entrypoint
# Heartbeat in background, agent-runner in foreground

# Start heartbeat (hourly prompts to give Peti an inner life)
# Disabled until heartbeat.ts is implemented
# node /app/heartbeat.js &

# Run agent-runner (reads stdin, calls Agent SDK, writes stdout markers)
exec node /app/agent-runner/dist/index.js
