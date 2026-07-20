# Day 19–26 文章真實性契約決策

## 目的

本文是 Day 19–26 開始實作前的文章／程式共同契約。它界定既有歷史快照、後續路由演進，以及 Demo 可誠實宣稱的伺服端邊界，避免文章把尚未存在的能力回填到早期證據。

## 時序：搜尋結果與詳情導覽

| 時點 | `search_events` 輸出 | 可驗證事實 |
|---|---|---|
| Day 17／18 歷史快照 | 活動摘要與不透明 `eventId`；沒有 `detailUrl` | 結果與錯誤契約只證明搜尋能力，不能證明詳情導覽。 |
| Day 24 | 在新增真實詳情 route 後，向前擴充加入 `detailUrl` | Agent 可用一般瀏覽器導覽至選定詳情頁；這不是另一個 Agent Tool。 |
| Day 25 | 使用 Day 24 之後的契約 | `search_events → 開啟 detailUrl → get_event_details → save_event` 是此時才成立的完整 Journey。 |

## Day 21：低風險寫入契約

- `save_event` 只加入收藏；已收藏時再次呼叫維持已收藏狀態並回傳可理解的冪等結果。
- `save_event` 不是 toggle，沒有取消收藏的 Agent Tool。
- 取消收藏只由 Day 22 的人類 UI 提供，作為可見、可接手的復原入口。
- 伺服端以測試 session 驗證建立可信任邊界；本 Demo 不因此宣稱完整帳號或企業級 RBAC。

## Day 26：可驗證的伺服端拒絕範圍

Day 26 只驗證下列三種 `save_event` 請求會被伺服端拒絕：

1. 未登入或無效 session。
2. body 中偽造 `userId`。
3. 不存在的公開 `eventId`。

公開活動不是使用者擁有的資源，因此不測試也不宣稱「活動不屬於目前使用者」的所有權檢查。這些案例證明的是測試 session 驗證下的最小伺服端可信任邊界；它們不等同完整帳號系統、OAuth、企業級 RBAC 或全面授權模型。

## Reviewer 檢查要點

- Day 17／18 不應出現 `detailUrl`；Day 24 是加入該欄位的唯一時點。
- Day 21 的 `save_event` 應只加入收藏且冪等；取消收藏僅在 Day 22 人類 UI。
- Day 26 的測試名稱與文章敘事應對應三種拒絕案例，不得改寫成公開活動的使用者所有權驗證。
