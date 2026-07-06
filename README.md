<div align="center">

<img src=".github/assets/banner.png" alt="Vexory - the project-first social network for builders" width="100%" />

# Vexory

**The project-first social network for builders.**

Not another feed of hot takes. Your profile is your projects: what you're
building, who you need, and the real progress behind it.

[![Live Beta](https://img.shields.io/badge/Live-network.vexory.xyz-7c5cff?style=for-the-badge)](https://network.vexory.xyz/)
[![Status](https://img.shields.io/badge/Status-Public%20Beta-fbbf24?style=for-the-badge)](#beta-notice)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-64607e?style=for-the-badge)](#license)

[**Try the beta**](https://network.vexory.xyz/)

</div>

---

## Beta notice

> **Vexory is in active development.** This is an early public beta: features
> change quickly, edge cases exist, and you may run into bugs. Feedback and bug
> reports are welcome in [Issues](../../issues).

---

## What is Vexory?

Most social networks put the person first and the noise follows. Vexory flips
it: **the Project is the core entity.** Every project gets its own page with a
build log, roadmap, team and open roles, and everything in the feed derives
from real product work instead of engagement bait.

**Signal, not noise.**

<div align="center">
<img src=".github/assets/screenshot-landing.png" alt="Vexory landing page" width="90%" />
</div>

## What's new

Recent beta updates sharpen both the product surface and the visual system:

- **Liquid Glass polish** - interactive project cards, feature blocks and metric
  panels now lift subtly on hover with stronger glass borders and violet depth.
- **Gradient emphasis** - hero highlights and discovery headlines now use a
  refined white-to-violet text treatment instead of flat accent color.
- **More tactile actions** - primary buttons, auth tabs and secondary CTAs now
  include press feedback for a more responsive feel.
- **Navigation clarity** - sidebar and command palette active states now use a
  left-edge indicator, smoother transitions and better contrast.
- **Progress detail** - project status tracks now show completed steps with a
  violet gradient line and soft glow.
- **Loading polish** - skeleton states now shimmer with a quieter violet-tinted
  pass that better matches the dark interface.

## Features

### Projects

- **Project pages** - build log, roadmap, team, open roles, posts and trust
  signals in one place.
- **Activity heatmap** - GitHub-style 12-week graph of shipping cadence with
  streaks.
- **Journey timeline** - IDEA -> BUILDING -> MVP -> LAUNCHED track plus dated
  milestone history.
- **Build proof** - attach commits, demos and deploy links to updates.
- **Momentum badges** - earned by real activity: *Shipping weekly*, *Recently
  launched*, *Hiring now*, *Team forming*.
- **Founder notes** - why a project exists, what changed, and what the team
  learned.
- **Launch pages** - public, shareable pages when a project ships.

### People & teams

- **Auto-portfolio profiles** - "Currently building" and "Launched" assemble
  themselves from a builder's projects.
- **Open roles & applications** - equity, paid, contract or volunteer roles,
  with fast application flows.
- **Team invites** - invite by email or username with role titles and
  permissions.
- **Team chat** - a private room per project.
- **Matches** - teammate recommendations based on skills and interests.

### Social

- **Smart feed** - Global, Following, Posts, Launches, Hiring, Milestones and
  Trending tabs.
- **Command palette** - `Ctrl K` from anywhere to search projects, people and
  roles or jump to pages.
- **Universal search** - projects, builders, open roles and posts with type
  filters.
- **Likes, comments, bookmarks and follows** - for people and projects.
- **Notifications** - follows, applications, comments and invites.

<div align="center">
<img src=".github/assets/screenshot-project.png" alt="Vexory project page" width="90%" />
</div>

## Design

Vexory uses a custom **Purple Liquid Glass** dark UI system: a deep navy-black
canvas, violet primary actions, glass as a material for elevated layers,
cursor-tracked sheen, ambient light fields and film-grain dithering.

The latest interaction pass makes the interface feel more tactile without
changing the product hierarchy: cards rise, buttons press, active navigation is
clearer, and progress elements carry more visual momentum.

## Tech stack

| Layer      | Tech                                                                  |
| ---------- | --------------------------------------------------------------------- |
| Framework  | [Next.js 16](https://nextjs.org/) App Router, Server Components, Server Actions |
| Language   | TypeScript                                                            |
| Database   | PostgreSQL + [Prisma 7](https://www.prisma.io/)                       |
| Auth       | [Auth.js v5](https://authjs.dev/) credentials + OAuth-ready           |
| Styling    | [Tailwind CSS 4](https://tailwindcss.com/) + custom design tokens     |
| Validation | [Zod 4](https://zod.dev/)                                             |
| Icons      | [Lucide](https://lucide.dev/)                                         |
| Deploy     | Docker + docker-compose                                               |

## Getting started

### Prerequisites

- Node.js 20+
- Docker for PostgreSQL, or any PostgreSQL 16 instance

### Setup

```bash
git clone https://github.com/rasvetovvv/vexory.git
cd vexory
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building.

### Production

```bash
docker compose up -d --build
```

## Roadmap

- [ ] Email notifications and invite delivery
- [ ] Image uploads for avatars, project logos and covers
- [ ] Real-time chat and notifications
- [ ] Project analytics for owners
- [ ] Investor discovery tools
- [ ] Public API

## Author

**Vadim** - [@rasvetovvv](https://github.com/rasvetovvv) · vadim.mos.dev@gmail.com

Building Vexory in public. Follow the progress at
[network.vexory.xyz](https://network.vexory.xyz/).

## License

Proprietary - all rights reserved. The source is public for transparency during
the beta; please do not redistribute or deploy your own instance without
permission.

---

<div align="center">
<sub>Star the repo if you like where Vexory is going.</sub>
</div>
