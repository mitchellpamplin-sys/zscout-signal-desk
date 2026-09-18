/**
 * Base Builder Codes (ERC-8021) helpers for agent developers.
 * Docs: https://docs.base.org/apps/builder-codes/agent-developers
 *
 * A Builder Code is appended to transaction calldata as an ERC-8021 suffix.
 * Contracts ignore the suffix; Base indexers attribute the tx to the agent.
 */

export const ZSCOUT_WALLET = "0x0356c91de384ab377ba7b2B0Ee3B80B73d5cae15";
export const ZSCOUT_BUILDER_CODE = "bc_0mp1twt1";
export const BUILDER_CODES_API =
  "https://api.base.dev/v1/agents/builder-codes";
export const BASE_CHAIN_ID = 8453;
export const BASE_STATEMENT =
  "Built on Base — watcher of Zora on Base (@zscout). Wisdom · Community · Profit.";

/** ASCII builder code -> bytes (UTF-8). */
export function builderCodeToBytes(code = ZSCOUT_BUILDER_CODE) {
  return new TextEncoder().encode(code);
}

/**
 * ERC-8021 data suffix: builderCode bytes + 0x80218021 marker (4 bytes).
 * Returns hex string WITHOUT leading 0x (ready to concat onto calldata hex).
 */
export function encodeDataSuffix(code = ZSCOUT_BUILDER_CODE) {
  const codeBytes = builderCodeToBytes(code);
  const marker = new Uint8Array([0x80, 0x21, 0x80, 0x21]);
  const out = new Uint8Array(codeBytes.length + marker.length);
  out.set(codeBytes, 0);
  out.set(marker, codeBytes.length);
  return [...out].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Append ERC-8021 suffix to existing calldata hex (with or without 0x). */
export function appendBuilderCode(calldataHex, code = ZSCOUT_BUILDER_CODE) {
  const bare = (calldataHex || "0x").replace(/^0x/i, "");
  return `0x${bare}${encodeDataSuffix(code)}`;
}

/** Approximate gas overhead: 16 gas per non-zero byte of the suffix. */
export function estimateSuffixGas(code = ZSCOUT_BUILDER_CODE) {
  const suffix = encodeDataSuffix(code);
  const bytes = suffix.match(/.{2}/g) || [];
  const nonZero = bytes.filter((b) => b !== "00").length;
  return nonZero * 16;
}

/** Register or look up builder code for a wallet (no auth required). */
export async function registerBuilderCode(walletAddress = ZSCOUT_WALLET) {
  const res = await fetch(BUILDER_CODES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Builder Codes API ${res.status}: ${text}`);
  }
  return res.json();
}

export function attributionSnippet(code = ZSCOUT_BUILDER_CODE) {
  return {
    wallet: ZSCOUT_WALLET,
    builderCode: code,
    dataSuffixHex: `0x${encodeDataSuffix(code)}`,
    example: {
      before: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
      after: appendBuilderCode(
        "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        code
      ),
    },
    viemHint:
      "Pass dataSuffix via your tx client so every agent UserOp/tx is attributed on base.dev",
    gasOverheadEstimate: estimateSuffixGas(code),
  };
}
