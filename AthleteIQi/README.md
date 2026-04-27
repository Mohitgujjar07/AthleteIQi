# ⚡ AthleteIQ — AI Fitness & Food Coach

An AI-powered fitness and nutrition web application built with vanilla HTML, CSS, and JavaScript. Personalized workout plans, meal tracking, calorie monitoring, and real-time AI coaching powered by Claude API.

---

## 🚀 Live Demo

🔗 [Deployed on Google Cloud Run](#) <!-- Replace with your Cloud Run URL -->

---

## 📸 Features

| Feature | Description |
|--------|-------------|
| 🏠 **Dashboard** | Calorie ring, macros, today's meals, water tracker, sleep, streak |
| 🏋️ **Workout Plan** | 7-day strength + cardio plan with exercise cards and "Mark as Done" |
| 🥗 **Nutrition Coach** | 4 diet modes: Bulking, Cutting, Maintain, Keto with food recommendations |
| 📈 **Progress Tracker** | Body weight chart, calorie chart, personal records, body composition |
| 🤖 **AI Coach** | Real-time chat powered by Claude AI with quick-prompt shortcuts |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Charts:** Chart.js 4.4.0
- **Fonts:** Google Fonts (Plus Jakarta Sans, JetBrains Mono)
- **Analytics:** Google Analytics (gtag.js)
- **Deployment:** Google Cloud Run (Docker + Nginx)

---

## 📁 Project Structure

```
AthleteIQ/
├── index.html      # Main HTML structure & semantic markup
├── styles.css      # All styles, responsive design, dark mode
├── app.js          # JavaScript logic, data, AI chat, test suite
├── Dockerfile      # Docker config for Cloud Run deployment
└── README.md       # Project documentation
```

---

## ✅ Requirements Checklist

### Code Quality
- `'use strict'` enforced in JavaScript
- JSDoc comments on all functions
- Clean separation: HTML / CSS / JS in separate files
- Modular, readable code structure

### Security
- XSS prevention via `sanitize()` function on all user inputs
- Input whitelist validation in `showPage()`
- Content Security Policy (CSP) meta header
- No sensitive data exposed in client code

### Efficiency
- `debounce()` utility for performance-sensitive handlers
- `localStorage` wrapper (`Store`) for state persistence
- `PerformanceObserver` monitors long tasks (>100ms)
- Service Worker API detection for PWA readiness
- Lazy DOM rendering for workout/nutrition/meal data

### Testing
- **25 automated tests** via inline `TestRunner`
- Covers: Security, Navigation, Storage, Data Integrity, Accessibility, DOM Structure, Performance, Google Services
- Tests run automatically on load (non-blocking, `setTimeout`)
- Results printed to browser console with pass/fail summary

### Accessibility
- Skip navigation link (`#skip-nav`) for keyboard users
- `aria-live`, `aria-label`, `role` attributes throughout
- All interactive elements keyboard accessible (`tabindex`, `onkeydown`)
- `prefers-reduced-motion` media query respected
- `prefers-color-scheme: dark` full dark mode support
- `visually-hidden` class for screen reader labels
- Semantic HTML5 (`<main>`, `<aside>`, `<nav>`, `<section>`)

### Google Services
- ✅ **Google Analytics** — `gtag.js` with `dataLayer` event tracking
- ✅ **Google Fonts** — Plus Jakarta Sans + JetBrains Mono
- ✅ **Structured Data** — `schema.org` JSON-LD (`WebApplication`)

---

## 🏃 Run Locally

Just open `index.html` in any browser — no build step needed:

```bash
git clone https://github.com/YOUR_USERNAME/AthleteIQ.git
cd AthleteIQ
open index.html
```

---

## ☁️ Deploy to Google Cloud Run

```bash
# In Google Cloud Shell
gcloud run deploy athleteiq \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Dockerfile included:**
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 8080
CMD sed -i 's/listen\s*80/listen 8080/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
```

---

## 👤 Author

**Mohit Gujjar**  
AthleteIQ — Built for the Food & Health App Challenge

---

## 📄 License

MIT License — free to use and modify.
