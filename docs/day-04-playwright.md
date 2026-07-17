# Day 4：Playwright 與頁面定位

Playwright 讓測試程式透過瀏覽器操作頁面；它不是 AI 專用工具，也沒有理解網站商業意圖。

## 兩種 locator 的角色

- `getByRole('button', { name: '搜尋活動', exact: true })`：Day 5 的教學實驗，故意把完整文案當成定位契約。
- `getByTestId('search-events-button')`：正式回歸測試的穩定識別碼，仍需搭配活動結果斷言驗證人類流程。

## 執行

```powershell
npm run test:browser
npm run test:browser:button-copy
```
