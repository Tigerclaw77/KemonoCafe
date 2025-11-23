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


KemonoCafe 1.0 – MVP Spec
Core concept:
A cozy online animal-girl maid café.
Users pick a girl, “nominate” her as their maid for the day, and chat with her using a limited number of messages. They can buy virtual drinks/snacks to increase their chat messages. Cute, slightly flirty (G–PG), not explicit.
________________________________________
1. User Flow (v1)
1.	Landing page
o	Hero section with 1–3 café girls visible.
o	Big “Enter the Café” / “Meet the Maids” button.
o	No complex account info yet on the front page.
2.	Maid selection
o	Grid of girls (static images).
o	Each has:
	Name
	Short one-line vibe (“shy barista”, “cheerful waitress”, etc.)
o	User clicks one → goes to “Your Table” (chat page).
3.	Nomination system
o	You can nominate 1 girl per day as “Your Maid”.
o	Nomination unlocks:
	A base bundle of chat messages (e.g. 20).
o	Nomination resets daily at 3 a.m. local time, not UTC.
4.	Chat
o	Simple one-on-one text chat with that girl.
o	Messages are “spent” from the user’s message balance.
o	Balance:
	Starts with free allocation from nomination.
	Can be topped up with purchases (drinks/snacks).
________________________________________
2. Items & Monetization (v1)
No deep economy. Just one clear idea:
“Buy cute café items → get more time with your maid.”
•	Drinks (e.g. Coffee, Tea, Boba)
o	All same price in v1 (for simplicity).
o	Each drink = +X chat messages (e.g. +10).
•	Desserts / Snacks
o	Also add chunks of messages (maybe a bigger amount than drinks).
o	Pure flavor difference (names & images), same internal effect at first.
•	Loyalty
o	Track how many days a user nominates someone.
o	Every 7th nomination is free (no payment) for that maid.
o	Requires at least a minimal account system to remember:
	User ID
	Maid ID
	Nominations count & last reset date
________________________________________
3. Time & Reset Logic
•	Daily reset:
o	The nomination opportunity resets daily at 3 a.m. in the user’s local time zone.
o	If they bought messages, those messages do not vanish at 3 a.m.
	Nomination resets.
	Unused paid message credits stay until spent.
•	Time zone handling:
o	Detect time zone using JS (Intl.DateTimeFormat().resolvedOptions().timeZone) or let the user pick from a list.
o	Store this in the DB with the user profile.
o	Daily reset logic uses that time zone, not raw UTC.
________________________________________
4. Accounts / Data You Actually Need (v1)
We can’t do this without at least lightweight accounts, because we need to track:
•	Who the user is
•	Which maid they nominated today
•	How many messages they have left
Minimum DB stuff:
•	users (or profiles)
o	id
o	email (or social login later)
o	timezone (string like "America/Chicago")
•	maids
o	id
o	name
o	image_url
o	personality_flavor_text (short)
•	user_nominations
o	id
o	user_id
o	maid_id
o	date (in user’s timezone or normalized date key)
o	loyalty_count (how many total days they’ve nominated this maid)
•	user_message_balances
o	id
o	user_id
o	maid_id
o	remaining_messages
