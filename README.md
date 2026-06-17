# 健康台灣深耕計畫 — 問題回報與管理系統

社團法人台北市醫師公會「健康台灣深耕計畫」專用的問題回報與管理系統，提供民眾/合作單位線上提問、查詢處理進度，以及承辦人員後台管理、回覆、統計與匯出的一站式平台。

---

## 主要功能

本系統以三個前端頁面對應三種使用情境，後端統一由 Express API（`/api/questions`）與 Firebase Realtime Database 支撐。

### 問題回報（`qa-submit.html` / `index.html` 的「問題回報」分頁）
- 民眾或合作單位填寫表單提交問題。
- 表單欄位：提問單位、聯絡人姓名、聯絡方式（Email 或電話）、問題類別、問題內容、優先等級（一般／緊急）。
- 前端進行必填欄位驗證，並以 Toast 提示提交結果。
- 問題類別固定為 6 類：系統操作、資料問題、流程疑問、技術問題、建議回饋、其他。
- 新建問題預設狀態為「待處理」，透過 `POST /api/questions` 寫入資料庫。

### 進度查詢（`qa-query.html` / `index.html` 的「進度查詢」分頁）
- 民眾輸入當初填寫的 Email 或電話，查詢自己回報問題的處理狀態。
- 透過 `GET /api/questions/public/search?contactInfo=...` 以聯絡方式精確比對。
- 顯示問題內容、單位、類別、狀態徽章；當狀態為「已回覆」或「已結案」時顯示回覆內容與回覆時間，否則顯示處理中提示。

### 管理後台（`qa-admin.html` / `index.html` 的「管理後台」分頁）
- **問題總覽**：依單位、狀態、類別、日期區間、關鍵字篩選問題清單。
- **回覆與狀態管理**：對單筆問題填寫回覆、回覆人，並更新狀態、類別、優先等級（`PUT /api/questions/:id`）。
- **軟刪除**：刪除問題不會實際移除資料，而是標記 `deleted`（`DELETE /api/questions/:id`）。
- **批量更新狀態**：勾選多筆問題一次更新為「處理中／已回覆／已結案」（`POST /api/questions/batch-update`）。
- **統計分析**：顯示問題總數，以及依狀態、單位、類別的統計（`GET /api/questions/stats`）。
- **匯出 Excel**：將（可套用篩選條件的）問題清單匯出成 `.xlsx`（`GET /api/questions/export`）。

> 狀態流程：待處理 → 處理中 → 已回覆 → 已結案。

---

## 技術棧

| 層級 | 技術 |
| --- | --- |
| 後端 | Node.js + [Express](https://expressjs.com/) 4 |
| 資料儲存 | Firebase Realtime Database（透過 REST API，以 [axios](https://axios-http.com/) 存取） |
| Excel 匯出 | [ExcelJS](https://github.com/exceljs/exceljs) |
| Excel 匯入（腳本） | [SheetJS / xlsx](https://sheetjs.com/)（devDependency） |
| 前端 | 原生 HTML / CSS / JavaScript（無框架） |

---

## 專案結構

```
meetbot-QA-system/
├── server.js                  # Express 進入點：靜態檔案、CORS、路由掛載、健康檢查
├── package.json
├── src/
│   ├── config.js              # Firebase Realtime DB 的 questions 節點網址
│   ├── firebase.js            # 封裝 qaGet / qaPost / qaPut / qaDelete（axios 對 Firebase REST）
│   └── routes/
│       └── questions.js       # 所有 /api/questions 路由（CRUD、查詢、統計、匯出、批量更新）
├── public/                    # 前端靜態資源
│   ├── index.html             # 單頁整合版（問題回報／進度查詢／管理後台 三分頁）
│   ├── qa-submit.html         # 問題回報頁
│   ├── qa-query.html          # 進度查詢頁
│   ├── qa-admin.html          # 管理後台頁
│   ├── css/                   # 樣式（theme.css 及各頁專屬樣式）
│   └── js/
│       ├── shared.js          # 共用工具：escapeHtml、formatTime、showToast、fetchJSON
│       ├── qa-submit.js       # 問題回報表單邏輯
│       ├── qa-query.js        # 進度查詢邏輯
│       ├── qa-admin.js        # 管理後台邏輯
│       └── qa-app.js          # index.html 單頁整合版的整體邏輯
└── scripts/
    ├── import-excel.js        # 將歷次問題 Excel 匯入資料庫
    └── fix-categories.js      # 批次修正單位名稱與類別歸類
```

---

## API 路由

所有路由皆掛載於 `src/routes/questions.js`：

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| `GET` | `/api/questions` | 取得問題列表（支援 `unit`/`status`/`category`/`priority`/`keyword`/`dateFrom`/`dateTo` 篩選） |
| `GET` | `/api/questions/:id` | 取得單筆問題 |
| `POST` | `/api/questions` | 新增問題 |
| `PUT` | `/api/questions/:id` | 更新問題（回覆、狀態、類別、優先等級） |
| `DELETE` | `/api/questions/:id` | 軟刪除問題 |
| `POST` | `/api/questions/batch-update` | 批量更新狀態 |
| `GET` | `/api/questions/stats` | 統計（總數、依狀態／單位／類別） |
| `GET` | `/api/questions/export` | 匯出 Excel（可套用篩選條件） |
| `GET` | `/api/questions/public/search` | 公開查詢（依 `contactInfo` 比對） |
| `GET` | `/health` | 健康檢查 |

---

## 安裝與啟動

### 需求
- Node.js（建議 18 以上）
- 可存取的 Firebase Realtime Database

### 步驟

```bash
# 1. 安裝相依套件
npm install

# 2. 啟動伺服器
npm start
```

預設監聽 `0.0.0.0:3000`（可用環境變數 `PORT` 覆寫）。啟動後開啟瀏覽器：

- 整合首頁：`http://localhost:3000/`（會自動導向 `/index.html`）
- 問題回報頁：`http://localhost:3000/qa-submit.html`
- 進度查詢頁：`http://localhost:3000/qa-query.html`
- 管理後台頁：`http://localhost:3000/qa-admin.html`

---

## 環境變數

| 變數 | 必填 | 預設值 | 說明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3000` | 伺服器監聽的埠號 |

> 註：Firebase Realtime Database 的網址目前直接定義於 `src/config.js`，並非透過環境變數設定。`.gitignore` 已排除 `.env`，可視需要自行擴充環境變數設定。

---

## 輔助腳本（`scripts/`）

兩支腳本皆直接使用 `src/firebase.js` 連線資料庫，並支援 `--dry-run` 參數先預覽、不寫入。

### `import-excel.js` — 匯入歷次問題
將「健康台灣深耕計畫_歷次問題與解決方法.xlsx」匯入 QA 系統。

- 依工作表（Sheet）對應到系統單位（如「衛生福利部」→「衛服部」、「工研院(資訊系統)」→「健康處方管理系統」等）。
- 解析各列的問題類別、遇到的問題、解決方法、資料來源、備註，並組合成問題內容。
- 有解決方法者匯入後狀態標記為「已回覆」，否則為「待處理」。

```bash
node scripts/import-excel.js --dry-run   # 僅預覽不寫入
node scripts/import-excel.js             # 實際匯入
```

> 注意：Excel 來源路徑於腳本內以絕對路徑寫死，移植時需自行調整 `EXCEL_PATH`。

### `fix-categories.js` — 修正單位與類別
資料清整腳本：

1. 將單位為「同仁」者改歸「社區駐點辦公室」。
2. 依內建對照表，把各種細分類別歸類為 6 個標準類別（系統操作、資料問題、流程疑問、技術問題、建議回饋、其他）；找不到對照者一律歸為「其他」。

```bash
node scripts/fix-categories.js --dry-run   # 僅預覽
node scripts/fix-categories.js             # 實際更新
```

---

## 授權

社團法人台北市醫師公會 · 健康台灣深耕計畫內部使用。
