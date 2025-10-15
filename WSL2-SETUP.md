# 🌐 WSL2 Development Server Setup Guide

## Quick Start

### 1. Stop Current Server
Press `Ctrl+C` in your terminal to stop the current server.

### 2. Start WSL2-Compatible Server
Run one of these commands:

```bash
# Option A: Use the WSL-specific script
npm run dev:wsl

# Option B: Use host exposure
npm run dev:expose

# Option C: Manual configuration
npx vite --host 0.0.0.0 --port 5173
```

### 3. Access from Windows
Open your Windows browser and visit:
- **Primary:** http://localhost:5173
- **Alternative:** http://127.0.0.1:5173
- **WSL IP:** http://[WSL-IP]:5173 (see below for finding IP)

---

## 🔧 Configuration Details

### Vite Configuration (Already Updated)
The `vite.config.ts` has been configured with:
- `host: true` - Exposes server to all network interfaces
- `usePolling: true` - Fixes file watching in WSL2
- `hmr` settings - Ensures Hot Module Replacement works

### Package.json Scripts (Already Added)
- `npm run dev:wsl` - Starts server with WSL2 optimizations
- `npm run dev:expose` - Exposes server to network

---

## 🔍 Finding Your WSL2 IP Address

### Method 1: From WSL Terminal
```bash
hostname -I | awk '{print $1}'
```

### Method 2: From Windows PowerShell
```powershell
wsl hostname -I
```

### Method 3: Check Network Adapter
```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to localhost:5173"

**Solution 1: Check if server is running**
```bash
# Check if port is listening
sudo lsof -i:5173

# Or
netstat -tuln | grep 5173
```

**Solution 2: Use WSL IP directly**
```bash
# Get WSL IP
hostname -I

# Access via: http://[YOUR-WSL-IP]:5173
```

**Solution 3: Restart WSL**
In Windows PowerShell (as Administrator):
```powershell
wsl --shutdown
# Then restart your WSL terminal
```

### Issue: "Windows Firewall blocking connection"

**Solution: Add Firewall Rule**
In Windows PowerShell (as Administrator):
```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "WSL2 Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow

# Or allow WSL2 completely
New-NetFirewallRule -DisplayName "WSL2" -Direction Inbound -InterfaceAlias "vEthernet (WSL)" -Action Allow
```

### Issue: "File changes not detected"

**Solution: Already fixed with polling**
The vite.config.ts now uses polling:
```javascript
watch: {
  usePolling: true,
  interval: 1000,
}
```

### Issue: "Slow performance"

**Solution 1: Move project to WSL filesystem**
Your project is already in `/home/lando555/` ✅

**Solution 2: Exclude from Windows Defender**
In Windows PowerShell (as Administrator):
```powershell
Add-MpPreference -ExclusionPath "\\wsl$\Ubuntu\home\lando555\flag-trax-game"
```

---

## 🚀 Optimal Development Workflow

### 1. Start Server
```bash
cd ~/flag-trax-game
npm run dev:wsl
```

### 2. Access URLs
You'll see output like:
```
➜  Local:   http://localhost:5173/
➜  Network: http://172.23.160.1:5173/
```

### 3. Windows Browser Access
- **Best:** http://localhost:5173 (usually works)
- **Fallback:** Use the Network URL shown

### 4. Mobile Testing (Bonus)
If your phone is on the same network:
1. Find your Windows IP: `ipconfig` in Command Prompt
2. Access: http://[WINDOWS-IP]:5173 from your phone

---

## 📋 Quick Checklist

- [x] Vite config updated with WSL2 settings
- [x] Package.json has WSL scripts
- [x] File watching uses polling
- [x] HMR configured for WSL2
- [ ] Test server with `npm run dev:wsl`
- [ ] Access from Windows browser
- [ ] Add firewall rule if needed
- [ ] Exclude from Windows Defender (optional)

---

## 🔐 Security Notes

**Development Only:** The `--host` flag exposes your server to all network interfaces. This is fine for development but should NOT be used in production.

**Firewall:** Only open ports you need. The firewall rule above only opens port 5173.

---

## 💡 Pro Tips

1. **Use Windows Terminal:** Better WSL2 integration than default console
2. **VS Code Remote WSL:** Edit files directly in WSL with Windows VS Code
3. **Performance:** Keep source code in WSL filesystem (`/home/`) not Windows (`/mnt/c/`)
4. **Browser DevTools:** Chrome/Edge DevTools work perfectly with WSL2 servers

---

## 🎯 Quick Commands

```bash
# Start WSL2 optimized server
npm run dev:wsl

# Get WSL IP
hostname -I

# Check if port is open
sudo lsof -i:5173

# Restart WSL (from Windows PowerShell)
wsl --shutdown
```

---

**Your server is now configured for WSL2! 🎉**
