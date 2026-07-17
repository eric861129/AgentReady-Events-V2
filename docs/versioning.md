# 30 天版本策略

## 原則

每一篇文章都對應一個可重現的 Git 快照。`day-XX-*` 是給讀者下載的固定分支，建立後不再修改；`main` 只保留下一篇尚未發布或剛整合完成的程式。

不要預先建立 30 個內容相同的 branch。只有當某一天的文章、示範與驗證都完成後，才從 `main` 建立該日快照與 tag。

## 讀者下載方式

```powershell
git clone --branch day-14-declarative-search-tool <repository-url>
Set-Location AgentReady-Events-V2
npm install
```

讀者也可以在已 Clone 的專案中切換：

```powershell
git fetch --tags
git switch day-14-declarative-search-tool
```

## 發布快照流程

1. 從 `main` 建立 `work/day-XX-<slug>`，只完成該篇需要的程式與測試。
2. 執行該日最小驗證，以及 `npm test`、`npm run typecheck`；需要畫面證據時再執行 `npm run test:browser`。
3. 將完成內容整合回 `main`，建立 Conventional Commit。
4. 從已驗證的 `main` 建立 `day-XX-<slug>`，並建立 `v0.x.0-day-XX` tag。
5. 文章連到 branch 或 tag；之後不得直接修改 `day-XX-*`。

## Branch 對照表

| Day | Reader branch | Tag | 狀態 |
|---:|---|---|---|
| 01 | `day-01-intro` | `v0.1.0-day-01` | 已建立 |
| 02 | `day-02-environment` | `v0.1.0-day-02` | 已建立 |
| 03 | `day-03-human-flow` | `v0.1.0-day-03` | 待建立 |
| 04 | `day-04-playwright` | `v0.1.0-day-04` | 待建立 |
| 05 | `day-05-button-copy-experiment` | `v0.1.0-day-05` | 待建立 |
| 06 | `day-06-webmcp-concept` | `v0.1.0-day-06` | 待建立 |
| 07 | `day-07-technology-boundaries` | `v0.1.0-day-07` | 待建立 |
| 08 | `day-08-tool-contract` | `v0.1.0-day-08` | 待建立 |
| 09 | `day-09-tool-selection` | `v0.1.0-day-09` | 待建立 |
| 10 | `day-10-api-strategy` | `v0.1.0-day-10` | 待建立 |
| 11 | `day-11-declarative-lab` | `v0.1.0-day-11` | 待建立 |
| 12 | `day-12-imperative-lab` | `v0.1.0-day-12` | 待建立 |
| 13 | `day-13-search-tool-spec` | `v0.1.0-day-13` | 待建立 |
| 14 | `day-14-declarative-search-tool` | `v0.1.0-day-14` | 待建立 |
| 15 | `day-15-agent-discovery` | `v0.1.0-day-15` | 待建立 |
| 16 | `day-16-agent-invocation` | `v0.1.0-day-16` | 待建立 |
| 17 | `day-17-tool-results` | `v0.1.0-day-17` | 待建立 |
| 18 | `day-18-tool-errors` | `v0.1.0-day-18` | 待建立 |
| 19 | `day-19-side-effect-boundaries` | `v0.1.0-day-19` | 待建立 |
| 20 | `day-20-human-in-the-loop` | `v0.1.0-day-20` | 待建立 |
| 21 | `day-21-save-event` | `v0.1.0-day-21` | 待建立 |
| 22 | `day-22-visible-tool-state` | `v0.1.0-day-22` | 待建立 |
| 23 | `day-23-shared-use-case` | `v0.1.0-day-23` | 待建立 |
| 24 | `day-24-tool-lifecycle` | `v0.1.0-day-24` | 待建立 |
| 25 | `day-25-agent-journey` | `v0.1.0-day-25` | 待建立 |
| 26 | `day-26-server-authorization` | `v0.1.0-day-26` | 待建立 |
| 27 | `day-27-tool-tests` | `v0.1.0-day-27` | 待建立 |
| 28 | `day-28-ui-change-comparison` | `v0.1.0-day-28` | 待建立 |
| 29 | `day-29-agent-ready-evidence` | `v0.1.0-day-29` | 待建立 |
| 30 | `day-30-retrospective` | `v0.1.0-day-30` | 待建立 |
