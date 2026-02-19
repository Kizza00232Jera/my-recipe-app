This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# My Recipe App

## Todo

- [x] 1. Deploy to Vercel (connect repo, confirm CI works)
- [ ] 2. Scaffold basic UI with mock recipe data (grid layout)
- [ ] 3. Tidy up build process (ESLint, Prettier, path aliases)
- [ ] 4. Set up database (Vercel Postgres + Drizzle ORM)
- [ ] 5. Attach database to UI (replace mock data with real queries)
- [ ] 6. Add authentication (Clerk — GitHub + Google)
- [ ] 7. Add recipe upload (Uploadthing + server action to save)
- [ ] 8. Taint server-only modules (server-only package)
- [ ] 9. Use next/image component (replace img tags)
- [ ] 10. Error management (Sentry)
- [ ] 11. Recipe page routing (parallel + intercepting routes)
- [ ] 12. Polish upload button UI
- [ ] 13. Toaster notifications (shadcn/ui toast)
- [ ] 14. Analytics (PostHog)
- [ ] 15. Delete recipe (server action + confirm dialog)
- [ ] 16. Rate limiting (Upstash Redis)