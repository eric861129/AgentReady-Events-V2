# Day 23 快照修訂紀錄

## 修訂原因

原 Day23 reader snapshot `e29e30182179af45d4fa4a7afd3c8aeac7abe040` 已完成 UI 與 Tool 共用 `SaveEventUseCase` 的收斂，但 review 發現 caller-result contract 未完整證明兩個入口對同一筆 `SaveEventSuccess | ApiError` 的消費方式。

修訂後的 snapshot 納入 `c6f28c8`：

- UI success/error boundary 接收完整 discriminated result，不自行推導 `changed`。
- UI 與 Tool 各以一次 `execute({ eventId })` 消費相同 success 或 API error contract。
- Tool 對 success 與 API error 都維持原樣 JSON mapping。

這是 Day23 的受控 correction；未加入 Day24 route、`detailUrl` 或 lifecycle 功能。

## Pre-review 封存

| Item | Value |
| --- | --- |
| old formal commit | `e29e30182179af45d4fa4a7afd3c8aeac7abe040` |
| old formal branch | `day-23-shared-use-case` |
| old formal annotated tag | `v0.1.0-day-23` |
| archive branch | `archive/day-23-shared-use-case-pre-review` → `e29e30182179af45d4fa4a7afd3c8aeac7abe040` |
| archive annotated tag | `v0.1.0-day-23-pre-review` → `e29e30182179af45d4fa4a7afd3c8aeac7abe040` |

archive refs 會先保存 old formal snapshot；在本文件與 versioning correction commit 建立後，正式 Day23 branch/tag 才能受控地指向 corrected snapshot。

## Formal snapshot purpose

新的 `day-23-shared-use-case` 與 `v0.1.0-day-23` 是 Day23 的正式讀者快照：它包含既有 shared use case、review caller contract 修正、versioning policy 與本次修訂證據。主要讀者下載 ref 為 immutable tag；branch 僅是 convenience clone ref。

## Required verification

從更新後的正式 Day23 branch 建立 `--single-branch` fresh clone，確認 clone HEAD 與 tag peeled SHA 相同，並執行：

```powershell
npm ci
npm run typecheck
npm test
npm run test:browser
npm run build
```

實際 command、SHA 與 outputs 追加於 Task 7 report 與 Day23 shared-use-case evidence。
