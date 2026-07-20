# Task 14 Report — Day 25 預發布 raw Tool evidence 修訂

## 狀態

完成 Day 25 evidence truthfulness 修訂。變更只位於 Day 25 test-support、integration/browser tests 與 evidence 文件；沒有修改 production source、API/session behavior、canonical event ID、其他日的 snapshot refs、文章或 assets。

## 修訂內容

- `Day25JourneyTestDoubleClient.executeTool()` 現在以 `Promise<string>` 表達 Tool response transport contract。
- 每個 `invoke` step 同時保存 `rawOutput` 與 `output`：前者是 `executeTool()` 原樣回傳字串，後者只由同一字串 `JSON.parse()` 取得。
- browser helper 不再先 parse Tool response；它會驗證回傳值是 JSON string，並把原字串交給 journey runner。
- 新增 `Day25JourneyTestDoubleAttachment` schema；attachment assertions 會確認三個 invocation step 都有字串型 `rawOutput`，且 `JSON.parse(rawOutput)` 深度等於同 step 的 `output`。
- `docs/evidence/day-25-agent-journey.md` 已區分 attachment JSON、raw Tool transport string 與 parsed assertion value；導覽 step 不是 Tool invocation，因此不宣稱有 `rawOutput`。

## TDD 紀錄

1. RED：先加入含換行與縮排的 Tool JSON string regression。聚焦 integration 執行為 7 tests 中 1 failed，差異明確顯示 invocation step 缺少 `rawOutput`；既有 6 tests 通過。
2. RED：先加入 browser attachment assertion。主要 journey browser test 失敗，明確顯示 `rawOutput` 型別為 `undefined`，預期為 `string`。
3. GREEN：讓 test-double client 傳遞原始字串，runner 保存 `rawOutput` 後再 parse `output`；同步調整故障注入 fake，使它們回傳 JSON string。
4. GREEN：聚焦 integration 7/7、主要 browser journey 1/1。
5. REFACTOR：加入明確 attachment type，並將文件語意收斂為可稽核的 raw transport string；聚焦 integration 7/7、Day 25 browser 3/3、typecheck 通過。

非 compact JSON regression 會逐字比對 `rawOutput`。若未保存 raw string，或從 parsed `output` 重新 `JSON.stringify()`，縮排與換行會遺失，測試會失敗。

## 驗證

| Gate | 結果 |
| --- | --- |
| `npm test -- tests/integration/day-25-agent-journey.test.ts` | 1 file、7 passed |
| `npm run test:browser -- --grep "Day 25"` | 3 passed |
| `npm run typecheck` | passed |
| `npm test` | 18 files、83 passed |
| `npm run test:browser` | 18 passed |
| `npm run build` | typecheck 與 Vite build passed；19 modules transformed |
| strict UTF-8 decode + U+FFFD scan | brief、report、Day 25 evidence 與三個變更測試檔全數通過 |
| `git diff --check` | passed |
| `git diff e8a0590 -- src server` | 無差異 |

## 範圍與風險

- Base：`e8a0590a9ed2faba6f871b53fedcf48f280272af`。
- canonical event ID 保持 `event-frontend-summit`，沒有 alias。
- 沒有修改 `src/`、`server/`、Day 24／26 文件、snapshot refs、文章或 assets。
- 沒有 push、force push、branch/tag repoint 或 remote publication。
- `JSON.parse()` 遇到非 JSON transport string 會讓 test journey 失敗；這符合本 evidence runner 只接受 Tool JSON string 的邊界。
