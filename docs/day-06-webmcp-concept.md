# Day 6：WebMCP 是什麼？網站終於可以自己介紹自己

## 本日的可重現畫面

首頁新增「Day 6 概念對照」卡片。它把既有的活動搜尋任務分成兩個視角：人類依畫面操作；Agent 則需要能力名稱、輸入與結果的結構化描述。

這張卡片刻意**不是** Tool 註冊。此時網站沒有 `document.modelContext.registerTool()`，也沒有 Agent discovery 或 invocation。讀者應先理解描述落差，再在 Day 11 和 Day 12 進入兩種 API 寫法。

## 範例能力描述

```text
name: search_events
input: { query: string }
result: 活動摘要清單
```

這是教學用的概念草圖；Day 13 才會決定正式 `search_events` 的完整 contract。

## 規格查核

- 查核日期：2026-07-17。
- [WebMCP Draft Community Group Report](https://webmachinelearning.github.io/webmcp/)：2026-07-10 版本，WebMCP 讓網頁把具有自然語言描述與結構化 schema 的能力提供給 Agent。
- [Chrome WebMCP 文件](https://developer.chrome.com/docs/ai/webmcp)：WebMCP 仍在持續討論與演進；本文不把它描述成已在所有瀏覽器普遍可用的標準。
