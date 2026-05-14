# Hello — AI Receptionist Dashboard

> The interface for an AI voice receptionist that answers calls in 95+ languages, books appointments, and runs outbound sales — built for the hospitality industry.

**Hackathon:** [Hospitality Hackathon 2026](https://www.hospitalityhackathon.et/) (ALX Ethiopia × Kuriftu Resorts) — National Finals · [Press coverage](https://thevoiceofafrica.com/2026/05/04/hospitality-hackathon-2026-demo-day-at-kuriftu-resorts-african-village-sets-global-innovation-record/)  
**Live Demo:** [hello-frontend-three.vercel.app](https://hello-frontend-three.vercel.app)  
**Backend:** [hello_backend repo](https://github.com/bekretsion/hello_backend)

---

## Demo Day

![Pitching Hello at Hospitality Hackathon 2026 National Finals — Kuriftu Resorts, Addis Ababa](./demo-day.jpg)
*Pitching Hello at the Hospitality Hackathon 2026 National Finals — Kuriftu Resorts, Addis Ababa*

---

## What it does

Hello replaces a human receptionist with an AI voice agent. The dashboard lets hospitality operators:

- Configure AI voice agents — language, persona, call scripts
- Monitor live and past calls with full transcripts
- Manage appointment bookings synced to Google Calendar and Outlook
- Set up post-call automation triggers — Slack, calendar, CRM
- Handle subscription billing and per-minute usage (Stripe)
- Send and track e-signature documents (Dropbox Sign)
- Run outbound calling campaigns to leads

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 + TypeScript |
| Styling | TailwindCSS v4 + Radix UI + shadcn/ui |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts + ApexCharts |
| Calendar | FullCalendar |
| Rich Text | Tiptap |
| Drag & Drop | dnd-kit |
| Voice | Vapi Web SDK |
| Payments | Stripe.js |
| E-signing | HelloSign Embedded |
| Animations | Motion (Framer) |
| i18n | next-intl |
| Error Tracking | Sentry |
| Deployment | Vercel |

---

## Running Locally

```bash
git clone https://github.com/bekretsion/hello_frontend
cd hello_frontend
npm install
cp .env.example .env.local   # add your API URL and keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Related

- [hello_backend](https://github.com/bekretsion/hello_backend) — Node.js + Express + MySQL backend with ElevenLabs, Stripe, Dropbox Sign, and Google/Outlook calendar integrations
