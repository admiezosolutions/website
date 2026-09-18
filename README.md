# Admiezo Private Limited — Smart Digital Solutions for Educational Institutions

A modern, high-performance showcase website built for **Admiezo Private Limited**, empowering colleges, universities, and educational institutions with Digital Evaluation and Intelligent ERP solutions.

![Vite](https://img.shields.io/badge/built%20with-Vite-646CFF.svg)
![GSAP](https://img.shields.io/badge/animation-GSAP%203-88CE02.svg)
![Lenis](https://img.shields.io/badge/smooth%20scroll-Lenis-black.svg)

---

## 🚀 Features

- **Lenis Smooth Scroll**: Buttery momentum smooth scrolling across all pages.
- **Interactive Spore Canvas**: Floating ambient particles with real-time mouse repulsion physics.
- **GSAP 3D Scroll Tilt & Zoom**: Interactive mouse-tracking 3D tilt on hero visuals, parallax background glows, and scroll-triggered section zoom.
- **Apple Dock-Style Feature Grids**: Lift & magnify hover micro-interactions.
- **Pill Badges with Gradient Borders & Glows**: Distinctive accent elements.
- **Dot-Corner Cards**: Pulsing corner dots with hover animations.
- **Interactive Tabs & Accordions**: Smooth tab switching and animated accordions for 10+ ERP modules.
- **5 Complete Pages**:
  - `index.html` — Home (Hero, Live Counters, Products Overview, Why Choose, Testimonials, Success Stories, CTA)
  - `products.html` — Digital Evaluation vs. College ERP interactive tabs and feature breakdowns
  - `solutions.html` — Universities, Engineering Colleges, Medical Colleges, and Autonomous Institutions
  - `about.html` — Who We Are, Vision, Mission, Leadership Team, Core Values, and Milestones Timeline
  - `contact.html` — Interactive validated demo request form, office info, WhatsApp quick-connect, and interactive location preview

---

## 🎨 Color Palette

| Token | Hex | Usage |
|---|---|---|
| **Primary Green** | `#176A4F` | Main brand, primary buttons, active links |
| **Green Hover** | `#125B43` | Button and interactive hover states |
| **Soft Green** | `#E8F2EE` | Selected states, icon background containers |
| **Main Text** | `#17231E` | High-contrast readable typography |
| **Muted Text** | `#68746E` | Secondary captions, card descriptions |
| **Page Background** | `#F4F6F5` | Clean page canvas background |
| **White Surfaces** | `#FFFFFF` | Card surfaces, inputs, floating panels |
| **Subtle Background** | `#F8FAF9` | Alternate section background |
| **Borders** | `#DCE3DF` | Modern borders and dividers |
| **Dark Background** | `#193229` | Footers, dark accents, stat strips |
| **Gold Accent** | `#A86D10` | Badges, corner dot highlights, metrics |
| **Error Red** | `#B83B3B` | Form validation error indicators |
| **Info Blue** | `#35637A` | Ambient glow lighting |

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Pages CI/CD workflow
├── public/
│   └── favicon.svg           # Brand favicon
├── src/
│   ├── js/
│   │   ├── accordion.js      # Smooth expand/collapse logic
│   │   ├── counter.js        # ScrollTrigger animated numbers
│   │   ├── form.js           # Form validation & feedback
│   │   ├── gsap-animations.js# 3D tilt, zoom & parallax scroll
│   │   ├── lenis-scroll.js   # Momentum smooth scroll setup
│   │   ├── nav.js            # Sticky header & mobile drawer
│   │   ├── spore-canvas.js   # Interactive particle physics canvas
│   │   └── tabs.js           # Tab switching component
│   ├── styles/
│   │   ├── base.css          # Typography, reset, utilities
│   │   ├── components.css    # Badges, cards, buttons, accordions
│   │   ├── layout.css        # Hero, header, footer, page sections
│   │   └── variables.css     # CSS custom properties & color system
│   └── main.js               # Entry point bundling CSS & JS
├── index.html                # Home page
├── products.html             # Products page
├── solutions.html            # Solutions page
├── about.html                # About Us page
├── contact.html              # Contact Us page
├── package.json
├── vite.config.js            # Multi-page build config with relative base
└── README.md
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle (into dist/)
npm run build

# 4. Preview production build locally
npm run preview
```

---

## 🌐 Deploying to GitHub

This repository comes pre-configured with **GitHub Actions** for automatic deployment to **GitHub Pages**.

### Step 1: Push to the private company repository

Run the following commands in your terminal:

```bash
git add .
git commit -m "Initial commit: Admiezo website showcase"

# Rename default branch to main
git branch -M main

# Add the private company repository remote
git remote add origin https://github.com/YOUR_ORGANIZATION/REPO_NAME.git

# Push to GitHub
git push -u origin main
```

### Step 2: Configure deployment

1. Keep the repository private and grant deployment access only to the company’s approved team.
2. Use the included GitHub Actions workflow or connect the private repository to Vercel/Netlify.
3. Store deployment credentials and environment values in repository or organization secrets; do not commit them.

---

## ⚡ Alternative One-Click Deployments

### Vercel
1. Import your GitHub repository on [vercel.com](https://vercel.com).
2. Framework Preset: **Vite** (detected automatically).
3. Click **Deploy**.

### Netlify
1. Import your GitHub repository on [netlify.com](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy Site**.

---

## 📄 Ownership

This repository and its source code are proprietary to Admiezo Private Limited. All rights reserved. No license to copy, modify, distribute, or publish this code is granted without written permission.
