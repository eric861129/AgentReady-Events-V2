# Day 5：按鈕文案改名實驗

## 固定條件

- 查詢：`前端`
- 預期商業結果：`event-frontend-summit`
- 未改動的實驗測試：`tests/experiments/day-05-button-copy.spec.ts`
- 唯一 UI 變更：搜尋 submit 按鈕由 `搜尋活動` 改為 `開始搜尋`

## 指令與結果

```powershell
npm run test:browser:button-copy
```

此指令在 Day 4 通過，在 Day 5 預期失敗：locator 依賴完整按鈕文案，網站的搜尋能力與資料結果本身並沒有消失。

## 不應得出的結論

這個實驗只證明一種 locator 對 UI 文案敏感；它不證明所有 Browser Automation 都不可靠，也不代表 WebMCP 已經解決所有網站自動化問題。
