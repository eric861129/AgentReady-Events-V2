# Day 2：本機開發環境

## 需要的工具

- Node.js 22.12 或更新版本
- Git
- 支援 Chromium 的 Playwright 瀏覽器

## 安裝與啟動

```powershell
npm install
npm run dev
```

## 基本驗證

```powershell
npm test
npm run typecheck
npm run build
npm run test:browser
```

## 最小排查順序

1. 用 `node --version` 確認 Node.js 版本。
2. 刪除目前終端後重新執行 `npm install`。
3. 確認開發伺服器顯示的網址可在本機瀏覽器開啟。
4. 若 Playwright 缺少瀏覽器，執行 `npx playwright install chromium` 後重試。
