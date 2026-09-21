# Kiln

Turn a niche and some expertise into a full digital product blueprint —
value proposition, product idea, transformation map, curriculum, written
lessons, and offer page copy — generated step by step and fully editable.

This is the real, deployable version. It's split in two pieces on purpose:

- **`src/`** — the frontend (what people see and click)
- **`api/generate.js`** — a tiny backend that holds your Anthropic API key
  and makes the actual AI calls, so the key never sits in the browser
  where anyone could steal it

## 1. Get an Anthropic API key

Go to [console.anthropic.com](https://console.anthropic.com), create an
account, and generate an API key. You'll need billing set up there — this
is separate from any Claude.ai subscription. Every generation in the app
costs a small fraction of a cent to a few cents depending on the model.

## 2. Deploy to Vercel (free to start)

This project is pre-configured for [Vercel](https://vercel.com), which
hosts both the frontend and the `/api` function together for free on
their hobby tier.

1. Push this folder to a GitHub repository.
2. Go to vercel.com, sign up, click "Add New Project," and import that repo.
3. Before the first deploy, open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = the key from step 1
   - (optional) `ANTHROPIC_MODEL` = `claude-sonnet-5` (this is the default if you skip it)
4. Click Deploy. You'll get a live URL like `kiln-yourname.vercel.app`.
5. Add a custom domain under Project Settings → Domains if you have one.

## 3. Test it locally first (optional but recommended)

```
npm install
cp .env.example .env        # then paste your real key into .env
npm install -g vercel        # only needed once
vercel dev                   # runs both the frontend and /api locally
```

`npm run dev` alone will run the frontend but the AI calls will fail,
since that command doesn't run the `/api` function — use `vercel dev`
to test the whole thing together.

## Notes on what's real vs. simplified here

- **Storage**: saved forges live in the visitor's own browser
  (`localStorage`), not a shared database. Good enough to ship, but it
  means a user's saved products don't follow them to a different device.
  If you want real accounts and cross-device saving, that means adding a
  database (Supabase is a common, generous-free-tier choice) and swapping
  the internals of `src/lib/storage.js` — nothing else in the app needs
  to change if you keep the same function names.
- **No payment gating yet**: this version is open to anyone with the
  link. To sell it, either (a) put the Vercel URL behind a Whop-gated
  page/redirect, or (b) add real auth + a check against your payment
  provider before rendering `<App />`. Ask if you want this built out.
- **Model**: defaults to `claude-sonnet-5`. You can point it at a
  cheaper or more powerful model anytime via the `ANTHROPIC_MODEL`
  environment variable, with no code changes.
