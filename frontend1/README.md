# 🎨 The Smurfing Hunter - Vercel Pastel Theme

**Clean, minimal AML platform with Vercel-inspired design**

---

## ✨ Current Version: PASTEL THEME

A beautiful **light theme** inspired by Vercel's clean, minimal aesthetic.

### 🎨 Design Philosophy

- **Light backgrounds** - White and off-white (#FAFAFA)
- **Soft pastels** - Purple (#7C3AED) and blue accents
- **Minimal borders** - Subtle, almost invisible (8% opacity)
- **Clean shadows** - Very soft and subtle
- **Generous spacing** - Breathing room everywhere
- **Vercel vibe** - Professional, modern, clean

---

## 📁 File Structure

```
smurfing-hunter/
├── index.html                      # Landing page (Pastel)
├── index-platform.html             # Main platform (Pastel)
│
├── BACKUPS:
├── index-landing-crypto.html       # Landing (Crypto.com dark)
├── index-platform-crypto.html      # Platform (Crypto.com dark)
│
├── css/
│   ├── pastel-theme.css           # CURRENT: Vercel pastel
│   └── crypto-theme-backup.css    # Backup: Crypto.com dark
│
└── js/
    ├── graph-renderer-crypto.js
    ├── main-crypto.js
    └── [all other JS files]
```

---

## 🚀 Access Your App

### **Current Version (Pastel Theme):**
**http://localhost:8000/** → Landing page  
**http://localhost:8000/index-platform.html** → Platform

### **Backup Version (Crypto.com Dark):**
**http://localhost:8000/index-landing-crypto.html** → Landing  
**http://localhost:8000/index-platform-crypto.html** → Platform

---

## 🎨 Color Palette (Pastel)

| Element | Color | Hex |
|---------|-------|-----|
| **Background** | Off-White | `#FAFAFA` |
| **Cards** | White | `#FFFFFF` |
| **Text Primary** | Black | `#000000` |
| **Text Secondary** | Gray | `#666666` |
| **Accent Primary** | Soft Purple | `#7C3AED` |
| **Accent Secondary** | Soft Blue | `#3B82F6` |
| **Success** | Green | `#10B981` |
| **Warning** | Orange | `#F59E0B` |
| **Danger** | Red | `#EF4444` |

---

## 🔍 What Changed vs Crypto.com Theme

| Aspect | Crypto.com (Dark) | Vercel (Pastel) |
|--------|-------------------|-----------------|
| Background | Navy #0D111C | Off-white #FAFAFA |
| Cards | Dark #1E2230 | White #FFFFFF |
| Text | White | Black |
| Accents | Subtle blues | Soft purple/blue |
| Borders | 6% white | 8% black |
| Shadows | Dark | Very light |
| Vibe | Professional dark | Clean minimal light |

---

## ✅ What's Preserved

- ✅ All functionality intact
- ✅ Graph visualization
- ✅ Top 50 suspicious wallets
- ✅ Pattern detection
- ✅ Live alerts
- ✅ Filters and controls
- ✅ Click-to-investigate
- ✅ Basic structure unchanged

---

## 🎯 Vercel Design Inspiration

What we borrowed from Vercel:

1. **Light, clean backgrounds**
2. **Soft purple primary color**
3. **Minimal borders** (barely visible)
4. **Subtle shadows** (soft and light)
5. **Generous whitespace**
6. **Clean typography**
7. **Simple, elegant cards**
8. **Professional minimalism**

---

## 💡 Switch Themes

Want to switch back to crypto.com dark theme?

1. Edit `index.html`:
   - Change link to `css/crypto-theme-backup.css`
2. Edit `index-platform.html`:
   - Change link to `css/crypto-theme-backup.css`

Or just use the backup files:
- `index-landing-crypto.html`
- `index-platform-crypto.html`

---

## 🎨 Customization

Edit `css/pastel-theme.css`:

```css
:root {
    --bg-primary: #FAFAFA;          /* Main background */
    --accent-primary: #7C3AED;      /* Purple accent */
    --accent-secondary: #3B82F6;    /* Blue accent */
}
```

---

## 📊 Features

### Landing Page
- Clean hero section
- Animated stats cards
- 6 feature highlights
- "Launch Platform" CTA
- Smooth animations

### Main Platform
- Interactive graph visualization
- Drag, zoom, pan nodes
- Top 50 suspicious table
- Live threat alerts
- Pattern detection
- Risk scoring
- Time/amount/token filters

---

## 🚀 Quick Start

1. Open **http://localhost:8000/**
2. See the pastel landing page
3. Click **"Launch Platform"**
4. Explore your AML tool with clean Vercel aesthetics!

---

**Design**: Vercel-inspired pastel theme  
**Version**: Light & Clean  
**Status**: ✅ Production Ready
