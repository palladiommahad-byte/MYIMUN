#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "Run this script as root after deployment-key login has been verified." >&2
    exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"
deploy_home="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"

if [[ ! -s "$deploy_home/.ssh/authorized_keys" ]]; then
    echo "No authorized key exists for $DEPLOY_USER." >&2
    exit 1
fi
ssh-keygen -l -f "$deploy_home/.ssh/authorized_keys" >/dev/null

cat > /etc/ssh/sshd_config.d/99-myimun-hardening.conf <<EOF
Port $SSH_PORT
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding no
AllowTcpForwarding no
MaxAuthTries 4
LoginGraceTime 30
EOF

sshd -t
systemctl reload ssh
echo "SSH password and root login are disabled. Keep this session open until a second key login succeeds."
