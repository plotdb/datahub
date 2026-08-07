# sharehub 離線編輯存活 ( v0.7.0 )

起因: 下游採用 sharehub 做即時同步的表單應用回報, websocket 瞬斷 >
重連 > 重畫後, 使用者剛輸入、尚未同步的資料會消失。追查確認 sharehub
有三處主動放棄資料, 使 sharedb 內建的 pendingOps 重送機制無從發揮;
本次配合 `@plotdb/ews` 0.2.x 的持久連線改造一併修正。


## 問題點與修正

 - `ops-out` 開頭的 `if @ews.status! != 2 => return` ( v0.5.8 引入 )
   在離線時默默丟棄 ops。移除後, `submitOp` 在斷線狀態會把 op
   樂觀套用到本地 `doc.data` 並排進 `pendingOps`, 重連後自動 flush。
   watchdog 離線時 `track` 本來就回 0 不追蹤, 不受影響。
 - `sdb.on \close, ~> @disconnect!` ( v0.5.3 引入 ) 在 socket 斷線時
   銷毀 doc — pendingOps 隨之陪葬。改為 fire `suspend` 事件,
   doc 帶著未確認的修改活過斷線, 重連後由 sharedb 自行收斂。
 - `connect` 對同一個 doc 原本一律 destroy + refetch ( `force` 預設
   true )。改為: 同 doc 時等待 `whenNothingPending` ( 本地修改全數
   被 server 確認 + 遠端漏掉的 ops 套用完 ) 後 resolve; `force` 預設
   改為 false, 明確傳 `{force: true}` 才走舊的重抓路徑。
   這同時消滅了持久連線下重複 subscribe 造成的孤兒回覆 crash。


## Breaking ( 行為面, API 簽名不變 )

 - `open` 不再於同 doc 重連時 re-fire — 依賴「每次 open 重新 `get()`
   重建 UI」的下游 ( 舊 README 曾如此建議 ) 會靜默失效, 應改聽
   `suspend` 或傳 `{force: true}`。
 - `close` 只在顯式 `disconnect` 時 fire; 斷線改聽 `suspend`。
 - `get()` 斷線期間不再回 null — 以 null 判斷離線的 code 失效。
 - 離線編輯從「默默丟棄」變「排隊重送」— 這是本次目的, 但若有下游
   依賴丟棄行為 ( 把 reset 當復原 ) 需注意。


## 相依與驗證

 - 需 `@plotdb/ews` >= 0.2.0 ( 持久 sharedb 連線 ); 實務上建議 0.2.2
   以上 ( dispose 合成 close, 修 `ERR_CONNECTION_STATE_TRANSITION_INVALID` )。
 - 驗證情境:
   - 猴子補丁靜音 `WebSocket.prototype.send` 或 `kill -STOP` server,
     輸入資料後等 watchdog ( 13s ) 宣告斷線, 恢復後確認資料存活且送達;
   - 確認重連只有一組 subscribe 往返, op 未被重複套用 ( server 依
     src / seq 去重 )。
 - 應用面配套建議: 下游可監聽 `suspend` 事件或輪詢 `doc.hasPending()`,
   在斷線被偵測到之前的半開窗口顯示「資料尚未確認送達」的非阻擋式提示。


## 發佈

版本 0.7.0。相關 commit: `69010a2` ( 主要變更 ),
`d5858f5` ( CHANGELOG breaking 標記 )。
