#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { buildDigest, digestToMarkdown } from "../src/digest.js";
import { ZSCOUT_WALLET } from "../src/builderCode.js";

const args = process.argv.slice(2);
const demo = args.includes("--demo");
const noLive = args.includes("--offline") || demo;
const asJson = args.includes("--json");
const walletIdx = args.indexOf("--wallet");
const outIdx = args.indexOf("--out");
const wallet =
  walletIdx >= 0 && args[walletIdx + 1]
    ? args[walletIdx + 1]
    : ZSCOUT_WALLET;
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;

const digest = await buildDigest({ wallet, live: !noLive });
const body = asJson
  ? JSON.stringify(digest, null, 2)
  : digestToMarkdown(digest);

if (outPath) {
  writeFileSync(outPath, body);
  console.error(`Wrote ${outPath}`);
}
console.log(body);
