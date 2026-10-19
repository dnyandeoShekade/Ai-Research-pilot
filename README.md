This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



ResearchPilot completion checklist
0/14



Core quality
[ ] Extract specific claims from reports
High


[ ] Verify each claim against source passages
High


[ ] Fix malformed citations and Markdown previews
High


[ ] Detect conflicting evidence across sources
High


[ ] Score source credibility and freshness
Medium



Product features
[ ] Export reports to PDF / Markdown
Medium


[ ] Save research history
Medium


[ ] Add follow-up questions about a report
Medium


[ ] Add research settings and source filters
Medium



Testing and deployment
[ ] Test correct, false, and unverified claims
High


[ ] Handle API failures, timeouts, and rate limits
High


[ ] Add loading, empty, and error states
Medium


[ ] Deploy frontend and backend online
High


[ ] Secure API keys and add basic abuse protection
High




How much time is left?
My rough estimate, assuming your current code continues to work:
- Basic polished MVP: 1–3 days
- Portfolio-ready project: 4–7 days
- More reliable, deployed version: 1–2 weeks

Feature	Status
Web research and source display	Implemented; needs broader testing
Claim verification	Implemented; needs accuracy testing
PDF upload and text extraction	Working in your test
RAG retrieval and AI answers	Working in your test
UI error and loading states	Basic implementation present
PDF size/type limits and malformed-file handling	Verify and strengthen
Multiple documents and document selection	Not confirmed
Conversation history and follow-up context	Not confirmed
PDF-grounded citations with actual passages	Partial — filenames and chunk references shown
User accounts and private document access	Not confirmed
Automated tests and deployment	Not confirmed
API rate limits, security, and usage monitoring	Not confirmed