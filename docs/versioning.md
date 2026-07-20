# 30 天版本策略

## 原則

每一篇文章都對應一個可重現的 Git 快照。`v0.1.0-day-XX` tag 是每一天不可變的主要讀者下載 ref；`day-XX-*` branch 是同一快照的便利 clone ref。`main` 只保留下一篇尚未發布或剛整合完成的程式。

不要預先建立 30 個內容相同的 branch。只有當某一天的文章、示範與驗證都完成後，才從 `main` 建立該日快照與 tag。

## 讀者下載方式

```powershell
git clone --single-branch --branch v0.1.0-day-14 <repository-url>
Set-Location AgentReady-Events-V2
npm install
```

讀者也可以在已 Clone 的專案中切換：

```powershell
git fetch --tags
git switch --detach v0.1.0-day-14
```

## 發布快照流程

1. 從 `main` 建立 `work/day-XX-<slug>`，只完成該篇需要的程式與測試。
2. 執行該日最小驗證，以及 `npm test`、`npm run typecheck`；需要畫面證據時再執行 `npm run test:browser`。
3. 將完成內容整合回 `main`，建立 Conventional Commit。
4. 從已驗證的 `main` 建立 immutable `v0.x.0-day-XX` tag，並建立指向相同 commit 的 `day-XX-<slug>` convenience branch。
5. 文章的主要下載連結使用 tag；branch 僅供需要 branch checkout 的讀者便利使用。建立後不得直接修改正式 reader refs。

## Day 19–26 漸進式開發規則

Day 19–26 的後半段開發一律從不可變的 Day 18 基線 `v0.1.0-day-18`（`615ee1c`）開始，集中在 `feature/day-19-to-day-26-agent-journey` 進行。建立該 worktree 時必須指定 tag，不得從目前 checkout 複製檔案：

```powershell
git -C D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2 worktree add `
  D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-day19-26 `
  -b feature/day-19-to-day-26-agent-journey v0.1.0-day-18
```

Day 19 的發布快照以前述 Day 18 tag 為唯一前置版本；Day 20–26 依序以前一天的不可變 tag 為前置版本。每一天完成驗證後，才建立下表的 reader branch 與 tag；建立後不得重寫或移動。開發過程可持續保留在 feature branch，但不可回寫 Day 1–22 的 branch 或 tag；Day23 僅能依快照修訂紀錄進行受控修訂。

Day 1–18 的 SHA 僅作歷史紀錄與追溯用途；本階段不修改任何既有 ref。Day 18 的實際基線與 ancestor 證據見 [Day 19–26 基線紀錄](evidence/day-19-to-day-26-baseline.md)。

Day 21 曾因審查發現的缺陷進行一次經授權的快照修訂；Day 22 已進行兩次經授權的快照修訂；Day23 依 reviewer 的 caller-result contract 修正進行一次受控修訂。每次原 reader branch/tag 對應的 commit 都以獨立 archive branch 與 annotated archive tag 保存；修訂目的、邊界與 fresh clone 驗收規則見 [Day 21 快照修訂紀錄](evidence/day-21-snapshot-revision.md)、[Day 22 快照修訂紀錄](evidence/day-22-snapshot-revision.md) 與 [Day 23 快照修訂紀錄](evidence/day-23-snapshot-revision.md)。此例外不授權修改 Day 1–22 的既有 ref；Day20 新增 canonical branch 也不移動既有 tag 或 compatibility alias。

## Day 20 canonical convenience branch

Day20 的正式 convenience branch 為 `day-20-human-in-the-loop`，以符合文章與系列規劃的名稱；它與 `v0.1.0-day-20` 指向相同 snapshot。唯一的 canonical branch clone command 為：

```powershell
git clone --single-branch --branch day-20-human-in-the-loop <repository-url>
```

舊有 `day-20-human-confirmation` 保留為 deprecated compatibility alias，不作為新的文章或文件 clone command。

## Branch 對照表

| Day | Reader branch | Tag | 狀態 |
|---:|---|---|---|
| 01 | `day-01-intro` | `v0.1.0-day-01` | 已建立 |
| 02 | `day-02-environment` | `v0.1.0-day-02` | 已建立 |
| 03 | `day-03-human-flow` | `v0.1.0-day-03` | 已建立 |
| 04 | `day-04-playwright` | `v0.1.0-day-04` | 已建立 |
| 05 | `day-05-button-copy-experiment` | `v0.1.0-day-05` | 已建立 |
| 06 | `day-06-webmcp-concept` | `v0.1.0-day-06` | 已建立 |
| 07 | `day-07-technology-boundaries` | `v0.1.0-day-07` | 已建立 |
| 08 | `day-08-tool-contract` | `v0.1.0-day-08` | 已建立 |
| 09 | `day-09-tool-selection` | `v0.1.0-day-09` | 已建立 |
| 10 | `day-10-api-strategy` | `v0.1.0-day-10` | 已建立 |
| 11 | `day-11-declarative-lab` | `v0.1.0-day-11` | 已建立 |
| 12 | `day-12-imperative-lab` | `v0.1.0-day-12` | 已建立 |
| 13 | `day-13-search-events-contract` | `v0.1.0-day-13` | 已建立 |
| 14 | `day-14-search-events-declaration` | `v0.1.0-day-14` | 已建立 |
| 15 | `day-15-agent-discovery` | `v0.1.0-day-15` | 已建立 |
| 16 | `day-16-search-events-invocation` | `v0.1.0-day-16` | 已建立 |
| 17 | `day-17-search-events-result` | `v0.1.0-day-17` | 已建立 |
| 18 | `day-18-search-events-errors` | `v0.1.0-day-18` | 已建立 |
| 19 | `day-19-side-effect-boundaries` | `v0.1.0-day-19` | 已發布 |
| 20 | `day-20-human-in-the-loop` | `v0.1.0-day-20` | 已發布；`day-20-human-confirmation` 為 deprecated compatibility alias |
| 21 | `day-21-save-event` | `v0.1.0-day-21` | 已修訂並封存原快照 |
| 22 | `day-22-visible-tool-state` | `v0.1.0-day-22` | 已第二次修訂並封存前快照 |
| 23 | `day-23-shared-use-case` | `v0.1.0-day-23` | 已受控修訂；pre-review snapshot 已封存 |
| 24 | `day-24-tool-lifecycle` | `v0.1.0-day-24` | 待建立 |
| 25 | `day-25-agent-journey` | `v0.1.0-day-25` | 待建立 |
| 26 | `day-26-server-authorization` | `v0.1.0-day-26` | 待建立 |
| 27 | `day-27-tool-tests` | `v0.1.0-day-27` | 待建立 |
| 28 | `day-28-ui-change-comparison` | `v0.1.0-day-28` | 待建立 |
| 29 | `day-29-agent-ready-evidence` | `v0.1.0-day-29` | 待建立 |
| 30 | `day-30-retrospective` | `v0.1.0-day-30` | 待建立 |
