# Banking knowledge corpus

`corpus.json` contains the 698 banking-domain documents from the tau2-bench repository at commit `2174a603f6d014ef94473ffa95957f6ce27100db`. Document IDs, titles, and contents are preserved verbatim. The normalized aggregate file's SHA-256 and document count are recorded in `manifest.json`.

The upstream corpus is distributed under the MIT License. This project carries its attribution and license text in [notices/tau-bench-LICENSE](../../../notices/tau-bench-LICENSE).

`index.ts` provides deterministic local ranked retrieval. It uses a title-weighted BM25-style lexical score and does not require embeddings, network access, or another API key.
