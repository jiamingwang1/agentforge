#!/bin/sh
# AgentForge Installer — curl -fsSL https://agentforge.dev/install | sh
set -e

REPO="jiamingwang1/agentforge"
INSTALL_DIR="/usr/local/lib/agentforge"
BIN="/usr/local/bin/agentforge"

echo "🚀 Installing AgentForge..."
echo ""

# Check dependencies
for cmd in docker node npm; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "❌ $cmd is required but not installed."
    case $cmd in
      docker) echo "   Install: curl -fsSL https://get.docker.com | sh" ;;
      node|npm) echo "   Install: curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs" ;;
    esac
    exit 1
  fi
done

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Start it with: systemctl start docker"
  exit 1
fi

echo "✅ Dependencies OK (docker, node, npm)"

# Download
echo "📦 Downloading AgentForge..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

if command -v git >/dev/null 2>&1; then
  git clone --depth 1 "https://github.com/$REPO.git" /tmp/agentforge-install 2>/dev/null
  cp -r /tmp/agentforge-install/* "$INSTALL_DIR/"
  rm -rf /tmp/agentforge-install
else
  curl -fsSL "https://github.com/$REPO/archive/main.tar.gz" | tar xz -C /tmp
  cp -r /tmp/agentforge-main/* "$INSTALL_DIR/"
  rm -rf /tmp/agentforge-main
fi

# Install Node dependencies
cd "$INSTALL_DIR"
if [ -f package.json ]; then
  npm install --production 2>/dev/null || true
fi

# Create bin symlink
cat > "$BIN" << 'WRAPPER'
#!/bin/sh
exec node /usr/local/lib/agentforge/src/cli.js "$@"
WRAPPER
chmod +x "$BIN"

echo ""
echo "✅ AgentForge installed!"
echo ""
echo "   agentforge deploy openclaw    # Deploy OpenClaw AI Agent"
echo "   agentforge deploy n8n         # Deploy n8n Automation"
echo "   agentforge status             # Check running agents"
echo "   agentforge logs <agent>       # View agent logs"
echo ""
echo "🚀 Get started: agentforge deploy openclaw"
