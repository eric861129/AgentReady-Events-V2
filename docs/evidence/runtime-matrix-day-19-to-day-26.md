# Day 19–26 runtime evidence matrix

> 取證日期：2026-07-20（Asia/Taipei）
>
> 原則：native Chrome、browser test double、真實 Demo API 與純 HTTP tests 不互相替代。

## 證據類型

| 類型 | 能證明什麼 | 不能宣稱什麼 |
| --- | --- | --- |
| unit／integration | schema、route guard、journey 停止條件與 use case 契約 | 原生 Chrome 已 discovery／invoke Tool |
| 純 HTTP／server tests | status、`errorCode`、session collection 前後狀態 | UI 或 Agent 真的走完流程 |
| Playwright browser test double | 頁面整合、Tool inventory、input/output、UI state | 原生 Inspector、Gemini 或真實 Agent session |
| Playwright + 真實 Demo API | 瀏覽器畫面與同源 API/session 的整合 | production auth/security audit |
| native Chrome observation | 指定版本、flags 與原始 Inspector／Agent 證據 | 本輪沒有取得，不得由 test double 推論 |

## 逐日矩陣

| Day | Snapshot | 主要可執行證據 | Browser 證據 | Native 狀態 |
| ---: | --- | --- | --- | --- |
| 19 | `12664f7` | 風險／副作用邊界文件；baseline 35 unit passed | baseline 8 passed；沒有新增 runtime claim | 未執行 |
| 20 | `1e1fcde` | 人類確認契約文件；baseline 35 unit passed | baseline 8 passed；沒有新增 runtime claim | 未執行 |
| 21 | `d29236e` | `save_event`、session API 與 route mismatch tests；60 unit passed | 10 passed；browser test double 與真實 Demo API 混合 suite | 未執行 |
| 22 | `93b813e` | 收藏 state hydration／同步；61 unit passed | 13 passed；包含真實 Demo API UI state 與 test double Tool save | 未執行 |
| 23 | `d9d1c8d` | UI／Tool 共用 save use case；64 unit passed | 13 passed；共用行為 regression | 未執行 |
| 24 | `eb023c5` | `detailUrl`、route lifecycle、stale handler 與 mismatch no-HTTP；76 unit passed | 15 passed；Day 24 JSON attachment 是 browser test double | 未執行 |
| 25 | `e8a0590` | 完整 journey、empty／error／mismatch／non-changing save 停止條件；82 unit passed | 18 passed；完整 journey attachment 明確是 browser test double | `UNSUPPORTED_FOR_THIS_EVIDENCE_RUN` |
| 26 | `fb07f4a` | 84 unit passed；server tests 驗證 401／400／404、`errorCode` 與 collection 不變 | 19 passed；Day 26 測試使用真實 Demo API，沒有安裝 WebMCP test double | 未執行 |

Day 25 的 native 狀態詳見
[`day-25-native-observation.md`](./day-25-native-observation.md)。Day 26 的 DOM
修改只建立「畫面不是 source of truth」的反例；成功或拒絕仍以 API response 與
session state 判定。

## `npm run dev`／Vite proxy smoke

Day 21–26 各自使用 primary tag fresh clone 啟動 `npm run dev`，所有 HTTP 都送到
Vite `http://127.0.0.1:5173`，不是直接繞到 API port。每次使用新 session cookie，
並在切換下一日之前確認 5173／8787 listener 已釋放。

| Day | checked at | UI `/` | `POST /api/demo-session` | cookie | `PUT /api/saved-events/event-frontend-summit` |
| ---: | --- | --- | --- | --- | --- |
| 21 | 23:21:16 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |
| 22 | 23:22:15 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |
| 23 | 23:23:23 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |
| 24 | 23:24:23 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |
| 25 | 23:25:16 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |
| 26 | 23:26:29 | 200；app root 存在 | 201；`status: ok` | `demo_session` 已保存 | 200；`saved: true, changed: true` |

原始 response、cookie、dev output 與 `summary.json` 保留於：

`D:\MySelf\iThome-2026\WebMCP\AgentReady-Events-V2-runtime-task11-20260720-232500`

Runtime harness 完成六日 summary 後卡在最後一個 background job output drain，因此
終止 harness controller；六日 HTTP assertions 已先持久化，終止後也再次確認
5173／8787 無 listener。較早兩個被 policy 阻擋的 process-tree cleanup 版本在執行前
即被拒絕，沒有產生 runtime claim。

## 固定 reviewer gates

- 正式 WebMCP Tool 只有 `search_events`、`get_event_details`、`save_event`；取消收藏
  只有人類 UI／HTTP 行為，沒有第四個正式 Tool。
- `save_event` input 只有 `eventId`；client 沒有 user ID input。測試中的偽造
  `userId` 是拒絕證據，server principal 才是資料歸屬來源。
- `ROUTE_MISMATCH` 在 HTTP 前停止；`errorCode` 保留 discriminated contract。
- `git grep detailUrl v0.1.0-day-17 -- src` 與 Day 18 同命令都沒有結果；Day 17／18
  historical contract 未被改寫。
- 本輪不產生最終文章 screenshot，也不撰寫對外文章。
