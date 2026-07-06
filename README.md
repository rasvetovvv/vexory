<p align="center">
  <img src=".github/assets/logo.png" alt="Vexory logo" width="96" />
</p>

<h1 align="center">Vexory</h1>

<p align="center">
  <strong>The project-first social network for builders.</strong>
</p>

<p align="center">
  Build in public, find teammates, follow real progress, and turn every project
  into a living portfolio.
</p>

<p align="center">
  <a href="https://network.vexory.xyz/">
    <img src="https://img.shields.io/badge/Live%20Beta-network.vexory.xyz-7c5cff?style=for-the-badge" alt="Live beta" />
  </a>
  <a href="#beta-notice">
    <img src="https://img.shields.io/badge/Status-Public%20Beta-fbbf24?style=for-the-badge" alt="Public beta" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js 16" />
  </a>
  <a href="#license">
    <img src="https://img.shields.io/badge/License-Proprietary-64607e?style=for-the-badge" alt="License" />
  </a>
</p>

<p align="center">
  <a href="https://network.vexory.xyz/"><strong>Open the beta</strong></a>
  &nbsp;|&nbsp;
  <a href="#features">Features</a>
  &nbsp;|&nbsp;
  <a href="#latest-polish">Latest polish</a>
  &nbsp;|&nbsp;
  <a href="#getting-started">Getting started</a>
</p>

<img src=".github/assets/banner.png" alt="Vexory - project-first social network for builders" width="100%" />

---

## Beta notice

Vexory is in active public beta. The product is moving quickly, behavior can
change between releases, and bug reports are welcome in [Issues](../../issues).

## Why Vexory

Most social networks are profile-first: people post, feeds get noisy, and real
work disappears between updates. Vexory flips the model.

**The project is the core entity.** Each project gets a page with a build log,
roadmap, team, open roles, launch history and progress signals. The social layer
comes from actual product work, not engagement bait.

<table>
  <tr>
    <td width="33%">
      <strong>Project-first</strong><br/>
      Profiles are built from what people are shipping, not from static resumes.
    </td>
    <td width="33%">
      <strong>Signal over noise</strong><br/>
      Feeds, badges and discovery are tied to launches, milestones and real updates.
    </td>
    <td width="33%">
      <strong>Teams form faster</strong><br/>
      Open roles, applications, invites and matching live close to the project.
    </td>
  </tr>
</table>

<p align="center">
  <img src=".github/assets/screenshot-landing.png" alt="Vexory landing page" width="92%" />
</p>

## Latest polish

The current beta pass focuses on making the product feel sharper, more tactile
and more premium without changing the underlying flow.

| Area | What changed |
| --- | --- |
| Liquid Glass UI | Interactive cards, feature blocks and metric panels now lift on hover with stronger glass borders and violet depth. |
| Hero emphasis | Landing and discovery headlines use a refined white-to-violet gradient instead of flat accent color. |
| Action feedback | Primary buttons, auth tabs and secondary CTAs now include subtle press states. |
| Navigation | Sidebar and command palette active states now use a left-edge indicator, smoother motion and clearer contrast. |
| Progress | Project status tracks now render completed steps with a violet gradient line and soft glow. |
| Loading states | Skeleton shimmer now uses a quieter violet-tinted pass that matches the dark interface. |

## Features

### Projects

- **Project pages** - build log, roadmap, team, open roles, posts and trust
  signals in one place.
- **Activity heatmap** - a 12-week graph of shipping cadence with streaks.
- **Journey timeline** - IDEA -> BUILDING -> MVP -> LAUNCHED with dated
  milestone history.
- **Build proof** - attach commits, demos and deploy links to updates.
- **Momentum badges** - earned by real activity: Shipping weekly, Recently
  launched, Hiring now and Team forming.
- **Founder notes** - share why the project exists, what changed and what the
  team learned.
- **Launch pages** - public, shareable pages when a project ships.

### People and teams

- **Auto-portfolio profiles** - Currently building and Launched sections assemble
  themselves from a builder's projects.
- **Open roles and applications** - equity, paid, contract or volunteer roles
  with fast application flows.
- **Team invites** - invite by email or username with role titles and
  permissions.
- **Team chat** - a private room per project.
- **Matches** - teammate recommendations based on skills and interests.

### Social layer

- **Smart feed** - Global, Following, Posts, Launches, Hiring, Milestones and
  Trending tabs.
- **Command palette** - `Ctrl K` from anywhere to search projects, people and
  roles or jump to pages.
- **Universal search** - projects, builders, open roles and posts with type
  filters.
- **Reactions and follows** - likes, comments, bookmarks and follows for people
  and projects.
- **Notifications** - follows, applications, comments and invites.

<p align="center">
  <img src=".github/assets/screenshot-project.png" alt="Vexory project page" width="92%" />
</p>

## Design system

Vexory uses a custom **Purple Liquid Glass** interface: deep navy-black canvas,
violet primary actions, glass as an elevated material, cursor-tracked sheen,
ambient light fields and subtle film-grain dithering.

The design goal is a focused night-time workspace: calm by default, luminous
where action and status matter.

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) with App Router, Server Components and Server Actions |
| Language | TypeScript |
| Database | PostgreSQL + [Prisma 7](https://www.prisma.io/) |
| Auth | [Auth.js v5](https://authjs.dev/) with credentials and OAuth-ready plumbing |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + custom design tokens |
| Validation | [Zod 4](https://zod.dev/) |
| Icons | [Lucide](https://lucide.dev/) |
| Deploy | Docker + docker-compose |

## Getting started

### Requirements

- Node.js 20+
- Docker for PostgreSQL, or any PostgreSQL 16 instance

### Local setup

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

**Vadim** - [@rasvetovvv](https://github.com/rasvetovvv) - vadim.mos.dev@gmail.com

Building Vexory in public at [network.vexory.xyz](https://network.vexory.xyz/).

## License

Proprietary - all rights reserved. The source is public for transparency during
the beta; please do not redistribute or deploy your own instance without
permission.

---

<p align="center">
  <sub>Star the repo if you like where Vexory is going.</sub>
</p>
