# AgentReady Events V2 開發規則

- 文章與程式日程以 `../WEBMCP-iThome-2026-Draft-V2/BookProposal.md` 與 `ArticleBriefs.md` 為準。
- `main` 是下一篇文章的整合線；`day-XX-*` 是讀者快照，建立後不得直接修改。
- 不預先實作後續日程的功能。Day 1–12 的練習碼與 Day 13 起的正式 Demo 必須清楚分開。
- 新行為以測試先行；Unit、typecheck、需要時的 Browser 測試都通過後，才能建立讀者快照。
- 不將 Fake Model Context、直接執行 Tool 或 mock 結果描述成真實 Agent discovery 或 invocation。
- 高風險寫入操作只準備可見的 UI 與人類確認；不得讓 Agent 直接完成報名或取消。
- 不推送遠端、不改寫既有快照分支，除非作者明確要求。
