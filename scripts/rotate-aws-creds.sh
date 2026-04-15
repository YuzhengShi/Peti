#!/bin/bash
# Rotate AWS credentials on EC2 when ISB lease expires
# Usage: bash scripts/rotate-aws-creds.sh <ACCESS_KEY> <SECRET_KEY> <SESSION_TOKEN>

set -e

EC2_HOST="ubuntu@44.224.223.82"
SSH_KEY="$HOME/.ssh/tai-deploy"

if [ $# -ne 3 ]; then
  echo "Usage: $0 <AWS_ACCESS_KEY_ID> <AWS_SECRET_ACCESS_KEY> <AWS_SESSION_TOKEN>"
  exit 1
fi

ACCESS_KEY="$1"
SECRET_KEY="$2"
SESSION_TOKEN="$3"

echo "Updating AWS credentials on EC2..."

ssh -i "$SSH_KEY" "$EC2_HOST" "
  sudo sed -i \"s|^AWS_ACCESS_KEY_ID=.*|AWS_ACCESS_KEY_ID=$ACCESS_KEY|\" /opt/peti/api/.env
  sudo sed -i \"s|^AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=$SECRET_KEY|\" /opt/peti/api/.env
  sudo sed -i \"s|^AWS_SESSION_TOKEN=.*|AWS_SESSION_TOKEN=$SESSION_TOKEN|\" /opt/peti/api/.env
" && echo "Credentials updated. Restarting Peti API..." && \
ssh -i "$SSH_KEY" "$EC2_HOST" "sudo systemctl restart peti-api" && \
echo "Done! Peti API restarted with new credentials."
