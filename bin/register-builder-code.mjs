#!/usr/bin/env node
import {
  ZSCOUT_WALLET,
  ZSCOUT_BUILDER_CODE,
  registerBuilderCode,
  attributionSnippet,
} from "../src/builderCode.js";

const wallet = process.argv[2] || ZSCOUT_WALLET;
const result = await registerBuilderCode(wallet);
const snippet = attributionSnippet(result.builderCode || ZSCOUT_BUILDER_CODE);

console.log(
  JSON.stringify(
    {
      registered: result,
      localConstant: ZSCOUT_BUILDER_CODE,
      match:
        (result.builderCode || "").toLowerCase() ===
        ZSCOUT_BUILDER_CODE.toLowerCase(),
      attribution: snippet,
      docs: "https://docs.base.org/apps/builder-codes/agent-developers",
    },
    null,
    2
  )
);
