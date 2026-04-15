# Library API Bench Dashboard (Vite + React + TS + Tailwind)

A lightweight, professional UI to:

- Switch between your **Spring Boot** and **Django** backends by changing the **Base URL**
- Run **single requests** and capture **TTFB / download / total** timings
- Run a **quick browser-side load test** (for sanity checks + screenshots)
- Export **CSV** (history + load tests) for your dissertation tables

> Note: Browser timings include client overhead. For dissertation-grade performance (p95/p99 under controlled load), use **k6**.

## Requirements
- Node.js 18+

## Install
```bash
npm install
```

## Run dev server
```bash
npm run dev
```
Open the URL shown (usually http://localhost:5173).

## Backends
- Spring Boot default: `http://localhost:8090`
- Django default: `http://localhost:8000`

Your backends should allow CORS for `/api/**` (both of your updated backends do).

## Useful workflow
1. Seed / create some Books, Members, Loans
2. Use **Single request** to verify endpoints work and capture timings
3. Use **History → Export CSV** to paste into your tables
4. Use **k6** for official load tests; keep UI screenshots as appendix evidence

---

### Tip for consistent comparisons
- Run both backends on the same machine
- Use the same dataset size
- Keep query params identical (page/size/q)
- Restart backends between benchmark runs if needed
