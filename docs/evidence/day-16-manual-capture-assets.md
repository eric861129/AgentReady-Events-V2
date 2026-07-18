# Day 16 Manual Capture Asset Manifest

此文件是 Day 16 原生 Inspector 手動擷取素材的版本控制交接契約，也是本 Git repository 的唯一 source of truth。

## Canonical Pending Asset

- 狀態：待擷取；尚未取得原生 Inspector 或 Gemini Agent 證據。
- 外部文章素材路徑：`WEBMCP-iThome-2026-Draft-V2/assets/day-16/runtime-native-inspector-invocation.png`

此路徑位於 workspace root 下、但不屬於本 repository 的外部文章素材資料夾。實際完成原生 Inspector 手動驗證後，應將截圖寫入上述確切路徑；在完成前，不得以 placeholder、Playwright browser test double 或預期輸出替代原生觀測。

## Mirror Relationship

外部文章素材資料夾的 `assets/README.md` 可保留相同資訊作為 mirror，但本 manifest 才是版本控制且可由乾淨 checkout 取得的正式交接契約；不得只依賴外部 `assets/README.md`。
