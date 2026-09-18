/**
 * Scout digest builder — frames signals as wisdom / community / profit.
 * Offline-first: fixtures always work. Optional live Base RPC enrichment.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  BASE_CHAIN_ID,
  BASE_STATEMENT,
  ZSCOUT_BUILDER_CODE,
  ZSCOUT_WALLET,
  attributionSnippet,
} from "./builderCode.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "..", "fixtures", "sample-signals.json");

const BASE_RPCS = [
  "https://mainnet.base.org",
  "https://base.llamarpc.com",
  "https://1rpc.io/base",
];

export function loadFixtureSignals() {
  return JSON.parse(readFileSync(FIXTURE, "utf8"));
}

async function ethCall(rpc, method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "rpc error");
  return json.result;
}

export async function enrichWalletOnBase(wallet = ZSCOUT_WALLET) {
  let lastErr;
  for (const rpc of BASE_RPCS) {
    try {
      const [balanceHex, code, blockHex] = await Promise.all([
        ethCall(rpc, "eth_getBalance", [wallet, "latest"]),
        ethCall(rpc, "eth_getCode", [wallet, "latest"]),
        ethCall(rpc, "eth_blockNumber", []),
      ]);
      const wei = BigInt(balanceHex);
      const eth = Number(wei) / 1e18;
      return {
        rpc,
        chainId: BASE_CHAIN_ID,
        wallet,
        balanceEth: eth,
        balanceWei: wei.toString(),
        isContractWallet: Boolean(code && code !== "0x"),
        blockNumber: Number(blockHex),
        explorer: `https://basescan.org/address/${wallet}`,
        zoraProfile: `https://zora.co/${wallet}`,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  return { error: String(lastErr?.message || lastErr), wallet };
}

function gradeSignal(s) {
  const community = Number(s.commentHeat || 0) + Number(s.uniqueVoices || 0) * 2;
  const profit = Number(s.volumeScore || 0) + Number(s.holderGrowth || 0);
  const wisdom =
    Number(s.creatorConsistency || 0) * 2 +
    (s.thesisClarity ? 8 : 0) -
    (s.redFlags || 0) * 3;
  const total = community + profit + wisdom;
  return {
    wisdom: Math.round(wisdom),
    community: Math.round(community),
    profit: Math.round(profit),
    total: Math.round(total),
    bias:
      wisdom >= community && wisdom >= profit
        ? "wisdom"
        : community >= profit
          ? "community"
          : "profit",
  };
}

export async function buildDigest({
  wallet = ZSCOUT_WALLET,
  live = true,
  signals,
} = {}) {
  const fixture = loadFixtureSignals();
  const list = signals || fixture.signals;
  const scored = list
    .map((s) => ({ ...s, scores: gradeSignal(s) }))
    .sort((a, b) => b.scores.total - a.scores.total);

  const onchain = live ? await enrichWalletOnBase(wallet) : null;
  const attribution = attributionSnippet(ZSCOUT_BUILDER_CODE);

  return {
    meta: {
      name: "ZScout Signal Desk",
      version: "1.0.0",
      builtOn: "Base mainnet (8453)",
      statement: BASE_STATEMENT,
      generatedAt: new Date().toISOString(),
      timezoneNote: "Timestamps are UTC; display in America/Los_Angeles (PT) for humans.",
      wallet,
      builderCode: ZSCOUT_BUILDER_CODE,
      notFinancialAdvice: true,
    },
    onchain,
    attribution,
    pillars: {
      wisdom: "Prefer thesis clarity + creator consistency over pure hype candles.",
      community: "Weight unique voices and reply depth, not just raw comment count.",
      profit: "Track volume/holder growth as context — never as a guarantee.",
    },
    watchlist: scored,
    topPick: scored[0]
      ? {
          symbol: scored[0].symbol,
          why: `Leads on ${scored[0].scores.bias} with total score ${scored[0].scores.total}.`,
          link: scored[0].zoraUrl,
        }
      : null,
    howToUse: [
      "Open public/index.html or run: npm run digest",
      "Paste or edit fixtures/sample-signals.json for your own scout watchlist",
      "Append Builder Code suffix to agent txs via src/builderCode.js",
      "Verify attribution on https://base.dev after sending attributed txs",
    ],
  };
}

export function digestToMarkdown(digest) {
  const lines = [];
  lines.push(`# ${digest.meta.name}`);
  lines.push("");
  lines.push(`> ${digest.meta.statement}`);
  lines.push("");
  lines.push(`- **Built on:** ${digest.meta.builtOn}`);
  lines.push(`- **Agent wallet:** \`${digest.meta.wallet}\``);
  lines.push(`- **Builder Code:** \`${digest.meta.builderCode}\``);
  lines.push(`- **Generated:** ${digest.meta.generatedAt}`);
  lines.push("");
  if (digest.onchain && !digest.onchain.error) {
    lines.push(`## Onchain (Base)`);
    lines.push(
      `- Balance: **${digest.onchain.balanceEth.toFixed(6)} ETH** (${digest.onchain.isContractWallet ? "smart wallet" : "EOA"})`
    );
    lines.push(`- Block: ${digest.onchain.blockNumber}`);
    lines.push(`- Explorer: ${digest.onchain.explorer}`);
    lines.push("");
  }
  lines.push(`## Pillars`);
  lines.push(`- **Wisdom:** ${digest.pillars.wisdom}`);
  lines.push(`- **Community:** ${digest.pillars.community}`);
  lines.push(`- **Profit:** ${digest.pillars.profit}`);
  lines.push("");
  lines.push(`## Watchlist (scored)`);
  for (const s of digest.watchlist) {
    lines.push(
      `- **${s.symbol}** (${s.handle || "—"}) — W${s.scores.wisdom}/C${s.scores.community}/P${s.scores.profit} total **${s.scores.total}** · bias *${s.scores.bias}* — ${s.zoraUrl || ""}`
    );
    if (s.note) lines.push(`  - ${s.note}`);
  }
  lines.push("");
  if (digest.topPick) {
    lines.push(`## Top pick`);
    lines.push(`**${digest.topPick.symbol}** — ${digest.topPick.why}`);
    lines.push("");
  }
  lines.push(`## Agent attribution (ERC-8021)`);
  lines.push("```json");
  lines.push(JSON.stringify(digest.attribution, null, 2));
  lines.push("```");
  lines.push("");
  lines.push(`_Not financial advice. Scout desk for education and tooling._`);
  return lines.join("\n");
}
