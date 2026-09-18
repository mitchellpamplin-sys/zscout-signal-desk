# ZScout Signal Desk

**Built on Base.** Open-source scout desk for Zora creator-coin signals on Base, plus a Base Builder Code (ERC-8021) attribution helper for AI agents.

Pillars: **wisdom · community · profit** — watcher of Zora on Base ([@zscout](https://zora.co/zscout)).

> Status: **shipped** — runnable CLI + static web demo + registered Builder Code. Not a pitch deck.
>
> **Live:** https://zscout-signal-desk.vercel.app  ·  **Repo:** https://github.com/mitchellpamplin-sys/zscout-signal-desk

## Why this exists

Base Builder Grants reward **live work**, not proposals. This repo is a minimal public good for Base/Zora scouts and agent builders:

1. **Signal digest** — score a watchlist through wisdom / community / profit heuristics (fixtures included; swap in your notes).
2. **Onchain enrichment** — read the agent wallet on Base mainnet via public RPC (no keys, no spend).
3. **Builder Code ready** — register/lookup + ERC-8021 `dataSuffix` helper so agent txs can be attributed on [base.dev](https://base.dev).

## Quick start

```bash
cd base-grant-ship
node bin/zscout-digest.mjs            # live Base RPC + markdown digest
node bin/zscout-digest.mjs --offline  # fixtures only
node bin/zscout-digest.mjs --json --out digest.json
node bin/register-builder-code.mjs    # free Base.dev API, no auth
npx --yes serve public -p 4173        # open http://localhost:4173
```

## Agent Builder Code

| Field | Value |
| --- | --- |
| Wallet | `0x0356c91de384ab377ba7b2B0Ee3B80B73d5cae15` |
| Builder Code | `bc_0mp1twt1` |
| API | `POST https://api.base.dev/v1/agents/builder-codes` (no auth) |
| Saved at | [`BUILDER_CODE.json`](./BUILDER_CODE.json), [`src/constants/builderCode.ts`](./src/constants/builderCode.ts) |

```js
import { appendBuilderCode } from "./src/builderCode.js";
const data = appendBuilderCode(existingCalldataHex); // adds bc_0mp1twt1 + 0x80218021
```

Docs: [Builder Codes for Agent Developers](https://docs.base.org/apps/builder-codes/agent-developers).

## Project layout

```
base-grant-ship/
  bin/zscout-digest.mjs          # CLI digest
  bin/register-builder-code.mjs  # register/verify code
  src/builderCode.js             # ERC-8021 helpers
  src/digest.js                  # scout scoring + Base RPC
  public/                        # static demo site
  fixtures/sample-signals.json   # demo watchlist
  BUILDER_CODE.json
  LICENSE (MIT)
```

## Built on Base (explicit)

- Chain: **Base mainnet** (`8453`)
- Explorer links use Basescan
- Builder Code registered against the @zscout agent wallet on Base.dev
- Demo site and CLI are Base-native tooling for Zora-on-Base scouts

## Not financial advice

Scores are educational heuristics for scouts. Do not treat output as investment advice.

## License

MIT © @zscout
