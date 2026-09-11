# Banking knowledge corpus

`docs/` contains the 698 original banking documents from tau2-bench at commit `2174a603f6d014ef94473ffa95957f6ce27100db`. Each filename is the original document ID, followed by `.md`. The first heading is its title; everything after the first blank line is the unchanged body.

Edit the Markdown directly. `index.ts` loads it once at startup and builds the search index in memory; restart the runner to pick up edits. There is no duplicate JSON corpus. `manifest.json` records the original provenance, document count, and hashes; local edits will differ from those original hashes.

The upstream corpus is distributed under the MIT License. This project carries its attribution and license text in [notices/tau-bench-LICENSE](../../../notices/tau-bench-LICENSE).

`index.ts` provides deterministic local ranked retrieval. It uses a title-weighted BM25-style lexical score and does not require embeddings, network access, or another API key.
