/**
 * import-excel.js
 * 將「健康台灣深耕計畫_歷次問題與解決方法.xlsx」匯入 QA 系統
 *
 * 用法：node scripts/import-excel.js
 *       node scripts/import-excel.js --dry-run   (僅預覽不寫入)
 */
const XLSX = require("xlsx");
const path = require("path");

// ── Firebase 設定（直接使用專案的 firebase 模組）──
const { qaPost } = require("../src/firebase");

// ── Excel 檔案路徑 ──
const EXCEL_PATH = path.resolve(
  "C:\\Users\\s7104\\OneDrive\\Desktop\\深耕計畫\\健康台灣深耕計畫 (1)\\新增資料夾\\健康台灣深耕計畫_歷次問題與解決方法.xlsx"
);

// ── Sheet 名稱 → 系統單位名稱 對照 ──
const UNIT_MAP = {
  "衛生福利部":     "衛服部",
  "工研院(資訊系統)": "健康處方管理系統",
  "合作診所":       "合作診所相關",
  "社區駐點辦公室":  "社區駐點辦公室",
  "課務與社區資源":  "課務與社區資源",
  "行政與人事管理":  "行政與人事管理",
};

// ── 需要匯入的 Sheet（跳過「總覽」）──
const SHEETS_TO_IMPORT = Object.keys(UNIT_MAP);

function parseSheet(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (rows.length < 2) return [];

  // 第一行是標題列（編號/問題類別/遇到的問題/解決方法/資料來源/備註）
  // 取得欄位名稱
  const keys = Object.keys(rows[0]);
  // keys[0] = sheet標題欄, keys[1]~keys[5] = __EMPTY, __EMPTY_1 ...

  const questions = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const values = Object.values(r);

    const num = values[0];
    if (typeof num !== "number") continue; // 跳過非資料列

    const category  = String(values[1] || "").trim();
    const problem   = String(values[2] || "").trim();
    const solution  = String(values[3] || "").trim();
    const source    = String(values[4] || "").trim();
    const note      = String(values[5] || "").trim();

    if (!problem) continue;

    questions.push({ category, problem, solution, source, note });
  }

  return questions;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("讀取 Excel 檔案...");
  const wb = XLSX.readFile(EXCEL_PATH);

  let total = 0;
  let success = 0;
  let errors = 0;

  for (const sheetName of SHEETS_TO_IMPORT) {
    const unitName = UNIT_MAP[sheetName];
    const questions = parseSheet(wb, sheetName);

    console.log(`\n── ${sheetName} → ${unitName}（${questions.length} 筆）──`);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      total++;

      // 組合問題內容
      let content = q.problem;
      if (q.source) {
        content += `\n\n【資料來源】${q.source}`;
      }
      if (q.note) {
        content += `\n【備註】${q.note}`;
      }

      const now = new Date().toISOString();
      const record = {
        unit: unitName,
        contactName: "歷次問題匯入",
        contactInfo: "system-import",
        category: q.category,
        content: content,
        priority: "一般",
        status: q.solution ? "已回覆" : "待處理",
        answer: q.solution || "",
        answeredBy: q.solution ? "歷次紀錄" : "",
        answeredAt: q.solution ? now : "",
        createdAt: now,
        updatedAt: now,
      };

      if (dryRun) {
        console.log(`  [${total}] ${unitName} / ${q.category} / ${q.problem.slice(0, 40)}...`);
      } else {
        try {
          const result = await qaPost(record);
          success++;
          console.log(`  [${total}] OK - ${q.category}: ${q.problem.slice(0, 40)}...`);
        } catch (e) {
          errors++;
          console.error(`  [${total}] FAIL - ${q.category}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n========================================`);
  if (dryRun) {
    console.log(`[預覽模式] 共 ${total} 筆待匯入`);
    console.log(`移除 --dry-run 參數以執行實際匯入`);
  } else {
    console.log(`匯入完成：成功 ${success} 筆，失敗 ${errors} 筆，共 ${total} 筆`);
  }
}

main().catch(e => {
  console.error("匯入錯誤:", e);
  process.exit(1);
});
