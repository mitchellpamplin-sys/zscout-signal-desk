const BUILDER_CODE = "bc_0mp1twt1";
const DEFAULT_WALLET = "0x0356c91de384ab377ba7b2B0Ee3B80B73d5cae15";

const SIGNALS = [
  { symbol: "FIRST3", handle: "first3", commentHeat: 18, uniqueVoices: 5, volumeScore: 14, holderGrowth: 11, creatorConsistency: 5, thesisClarity: true, redFlags: 1, note: "Higher profit heat; watch for thin thesis vs volume." },
  { symbol: "IRONWOOD", handle: "ironwood", commentHeat: 12, uniqueVoices: 7, volumeScore: 9, holderGrowth: 6, creatorConsistency: 8, thesisClarity: true, redFlags: 0, note: "Community-first creator coin narrative on Base." },
  { symbol: "GRAIN", handle: "grain", commentHeat: 8, uniqueVoices: 9, volumeScore: 4, holderGrowth: 3, creatorConsistency: 9, thesisClarity: true, redFlags: 0, note: "Wisdom-leaning: consistent creator, calmer tape." },
  { symbol: "DEADBURN", handle: "deadburn", commentHeat: 22, uniqueVoices: 4, volumeScore: 16, holderGrowth: 8, creatorConsistency: 3, thesisClarity: false, redFlags: 2, note: "Noise-heavy; red flags dampen wisdom score." },
];

function encodeDataSuffix(code = BUILDER_CODE) {
  const bytes = new TextEncoder().encode(code);
  const marker = [0x80, 0x21, 0x80, 0x21];
  return [...bytes, ...marker].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function grade(s) {
  const community = Number(s.commentHeat || 0) + Number(s.uniqueVoices || 0) * 2;
  const profit = Number(s.volumeScore || 0) + Number(s.holderGrowth || 0);
  const wisdom =
    Number(s.creatorConsistency || 0) * 2 +
    (s.thesisClarity ? 8 : 0) -
    (s.redFlags || 0) * 3;
  const total = community + profit + wisdom;
  const bias =
    wisdom >= community && wisdom >= profit
      ? "wisdom"
      : community >= profit
        ? "community"
        : "profit";
  return { wisdom: Math.round(wisdom), community: Math.round(community), profit: Math.round(profit), total: Math.round(total), bias };
}

function renderRows() {
  const scored = SIGNALS.map((s) => ({ ...s, scores: grade(s) })).sort(
    (a, b) => b.scores.total - a.scores.total
  );
  const tbody = document.getElementById("rows");
  tbody.innerHTML = scored
    .map(
      (s) => `<tr>
      <td><strong>${s.symbol}</strong><br/><span class="muted">@${s.handle}</span></td>
      <td><span class="w">${s.scores.wisdom}</span>/<span class="c">${s.scores.community}</span>/<span class="p">${s.scores.profit}</span></td>
      <td><strong>${s.scores.total}</strong></td>
      <td><span class="tag ${s.scores.bias}">${s.scores.bias}</span></td>
      <td class="muted">${s.note}</td>
    </tr>`
    )
    .join("");
}

function renderSuffix() {
  const hex = "0x" + encodeDataSuffix();
  document.getElementById("suffixBox").textContent = JSON.stringify(
    {
      builderCode: BUILDER_CODE,
      dataSuffixHex: hex,
      appendExample:
        "0xa9059cbb…0001" + encodeDataSuffix(),
      gasOverheadEstimate: 240,
      verify: "https://base.dev",
    },
    null,
    2
  );
  return hex;
}

async function refreshOnchain() {
  const wallet = document.getElementById("wallet").value.trim() || DEFAULT_WALLET;
  const el = document.getElementById("walletMeta");
  el.textContent = "Querying https://mainnet.base.org …";
  try {
    const body = (method, params) =>
      fetch("https://mainnet.base.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }).then((r) => r.json());

    const [bal, code, block] = await Promise.all([
      body("eth_getBalance", [wallet, "latest"]),
      body("eth_getCode", [wallet, "latest"]),
      body("eth_blockNumber", []),
    ]);
    const eth = Number(BigInt(bal.result)) / 1e18;
    const smart = code.result && code.result !== "0x";
    el.innerHTML = `<code>${wallet.slice(0, 6)}…${wallet.slice(-4)}</code><br/>
      ${eth.toFixed(6)} ETH · ${smart ? "smart wallet" : "EOA"} · block ${Number(block.result)}<br/>
      <a href="https://basescan.org/address/${wallet}" target="_blank" rel="noreferrer">Basescan</a> ·
      <a href="https://zora.co/${wallet}" target="_blank" rel="noreferrer">Zora</a>`;
  } catch (e) {
    el.textContent = "RPC unavailable in browser — CLI still works: npm run digest";
  }
}

document.getElementById("refresh").addEventListener("click", refreshOnchain);
document.getElementById("copySuffix").addEventListener("click", async () => {
  const hex = renderSuffix();
  await navigator.clipboard.writeText(hex);
  const btn = document.getElementById("copySuffix");
  btn.textContent = "Copied";
  setTimeout(() => (btn.textContent = "Copy dataSuffix"), 1200);
});

renderRows();
renderSuffix();
refreshOnchain();
