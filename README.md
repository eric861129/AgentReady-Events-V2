# AgentReady Events V2

這是「網站終於會說話：30 天從瀏覽器自動化走進 WebMCP」的示範專案。每一天都有一個固定的 Git branch，讀者可以下載與當日文章一致的版本，而不必從最新程式碼倒推過去的步驟。

## Day 1–2 共同起點

Day 1 的 `day-01-intro` branch 提供活動網站基線：人類可搜尋活動、查看詳情並收藏活動。Day 1 不包含 WebMCP 行為；Day 2 則提供可重現的本機開發環境。

```powershell
git clone --branch day-02-environment <repository-url>
Set-Location AgentReady-Events-V2
npm install
npm run dev
```

請以 Node.js 22.12 或更新版本執行。完整的安裝、啟動、驗證與排查步驟請見 [Day 2 本機開發環境](docs/day-02-environment.md)。

## 驗證

```powershell
npm test
npm run typecheck
npm run test:browser
```

## 分支規則

- `main`：下一篇文章的整合開發線。
- `day-XX-*`：讀者下載用的不可回寫快照分支。
- `v0.x.0-day-XX`：與快照分支指向同一 commit 的 Git tag。

完整的 30 天 branch 對照與建立流程請見 [docs/versioning.md](docs/versioning.md)。

## 範圍

這個專案只服務文章中的活動網站 Demo。每一天只引入該日需要的能力；不為了預先準備後續內容，而在早期 branch 加入 WebMCP、後端授權或其他尚未教過的功能。
