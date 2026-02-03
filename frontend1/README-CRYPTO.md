# 🚀 The Smurfing Hunter - Crypto.com Theme

**Enterprise AML Intelligence with Crypto.com Design**

---

## ✨ What You Have Now

A complete **2-page application** with crypto.com's exact design:

### 1. **Landing Page** (`index.html`)
- Hero section with gradient title
- Animated stats (500+ wallets, 98% detection, 147 threats)
- Feature cards showcasing capabilities
- "Launch Platform" CTA button
- **Opens at**: http://localhost:8000/

### 2. **Main Platform** (`index-crypto.html`)
- Dark navy theme matching crypto.com
- Interactive graph visualization
- Top 50 suspicious wallets table
- Live alerts feed
- Full AML detection capabilities

---

## 🎨 Design System (Crypto.com Exact Match)

### Colors
```css
Background:        #0B1426 (Dark Navy)
Cards:             #1A2642 (Lighter Navy)
Text Primary:      #FFFFFF (White)
Text Secondary:    #B0BAD3 (Light Gray)
Accent Blue:       #1652F0
Accent Cyan:       #00C9FF
Accent Purple:     #7B61FF
Success Green:     #16C784
Warning Orange:    #FFA726
Danger Red:        #EA3943
```

### Typography
- Font: **Inter** (same as crypto.com)
- Hero Title: 72px, Weight 800
- Section Titles: 40px, Weight 700
- Body: 16px, Weight 400

### Components
- Dark cards with `rgba(255, 255, 255, 0.08)` borders
- Gradient buttons (blue to purple)
- Pill-shaped breadcrumbs
- Smooth hover animations
- Generous whitespace everywhere

---

## 🚀 User Journey

1. **User visits** → http://localhost:8000/
2. **Sees landing page** with hero, stats, features
3. **Clicks "Launch Platform"**
4. **Enters main app** at `index-crypto.html`
5. **Explores**:
   - Interactive network graph
   - Click wallets in Top 50
   - View ego graphs
   - See live alerts
   - Use filters

---

## 📁 File Structure

```
smurfing-hunter/
├── index.html                    # NEW: Landing page
├── index-crypto.html             # NEW: Main platform
├── css/
│   └── crypto-theme.css          # NEW: Crypto.com theme
├── js/
│   ├── graph-renderer-crypto.js  # NEW: Graph with crypto colors
│   ├── main-crypto.js            # NEW: Main app logic
│   └── [original JS files]       # Reused backend
└── data/
    └── wallet_transactions.csv   # Your data
```

---

## 🎯 Features

### Landing Page
- ✅ Animated hero section
- ✅ Real-time stats display
- ✅ 6 feature cards
- ✅ Smooth scroll animations
- ✅ Mobile responsive

### Main Platform
- ✅ Interactive graph (drag, zoom, pan)
- ✅ Click-to-investigate wallets
- ✅ Top 50 suspicious wallets
- ✅ Live threat alerts
- ✅ Pattern detection (fan-out, peeling, etc.)
- ✅ Risk scoring
- ✅ Filters (time, amount, tokens)

---

## 🔥 What Makes It Match Crypto.com

1. **Dark navy backgrounds** - Exact hex codes
2. **Gradient accents** - Blue to purple on buttons/text
3. **Card-based layout** - Everything in clean cards
4. **Generous spacing** - 32-64px between sections
5. **Pill breadcrumbs** - Rounded full with subtle borders
6. **Hover states** - Smooth translateY(-4px) on cards
7. **Typography** - Inter font, bold headlines
8. **Shadows** - Subtle with rgba(0,0,0,0.3-0.5)

---

## 🌐 Access Your App

### Start Here (Landing Page):
**http://localhost:8000/**

### Direct to Platform:
**http://localhost:8000/index-crypto.html**

### Other Versions (for reference):
- Original: `index-original.html` (if you kept backup)
- Enhanced Cyber: `index-enhanced.html`
- Refined Pastel: `index-refined.html`

---

## 💡 How It Works

1. **Landing page** is pure HTML/CSS (no backend needed)
2. **Main platform** uses your existing backend:
   - `data-processor.js` - Loads CSV data
   - `graph-engine.js` - Generates graph views
   - `pattern-detector.js` - Finds suspicious patterns
   - `graph-renderer-crypto.js` - Renders with D3.js
   - `main-crypto.js` - Coordinates everything

---

## 🎨 Customization

Want to tweak colors? Edit `css/crypto-theme.css`:

```css
:root {
    --bg-primary: #0B1426;    /* Change main background */
    --accent-blue: #1652F0;   /* Change primary accent */
    /* ... */
}
```

Want different stats on landing? Edit `index.html` line ~200

---

## 📊 What The Platform Does

1. **Loads** 500 wallet transactions from CSV
2. **Analyzes** with graph neural network scoring
3. **Detects** patterns:
   - Fan-out (1 → many)
   - Peeling chains
   - Re-aggregation
   - Circular flows
4. **Scores** each wallet 0-100% suspicion
5. **Visualizes** as interactive network
6. **Alerts** on high-risk activity

---

## ✅ All Working Features

- [x] Landing page with CTA
- [x] Graph visualization
- [x] Zoom/pan/reset
- [x] Click wallet → ego graph
- [x] Top 50 suspicious table
- [x] Live alerts feed
- [x] Time filters
- [x] Amount filters
- [x] Token filters
- [x] Risk scoring
- [x] Pattern detection
- [x] Dark theme throughout
- [x] Mobile responsive

---

## 🚀 Next Steps

1. Open http://localhost:8000/
2. See the landing page
3. Click "Launch Platform"
4. Explore the AML detection
5. Click wallets to investigate

**Enjoy your crypto.com-styled AML platform!** 🎉
