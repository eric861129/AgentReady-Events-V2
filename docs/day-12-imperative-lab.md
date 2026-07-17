# Day 12：Imperative API Lab

## 本日的生命週期

既有 Demo 仍使用詳情對話框，沒有提早引入 Day 24 才會處理的路由。當使用者開啟一場活動詳情時，程式才會嘗試註冊下列唯讀 Lab Tool：

```ts
await document.modelContext.registerTool({
  name: 'get_current_event_lab',
  description: '讀取使用者目前正在查看的活動摘要。僅在活動詳情開啟期間可用。',
  inputSchema: { type: 'object' },
  annotations: { readOnlyHint: true },
  execute: async () => JSON.stringify(currentEvent)
}, { signal: registrationController.signal });
```

關閉詳情時呼叫 `registrationController.abort()`，瀏覽器便可解除該 Tool。這個 Tool 只讀取目前活動摘要，不收藏、不報名、不付款，也不改變資料。

## 真實能力與不支援情境

Lab 只在 `document.modelContext` 存在時呼叫真實 `registerTool()` 與 `getTools()`。若瀏覽器未提供這個 API，畫面會明確顯示「此瀏覽器未提供 WebMCP」，並且不顯示假的 Tool 清單、更不宣稱 Agent 已發現或呼叫能力。

Playwright 的一般 Chromium 驗證屬於後一種情境，因此它驗證的是誠實的不支援文案；支援 WebMCP 的 Chrome 環境則可從畫面看到 `getTools()` 的實際回傳名稱。
