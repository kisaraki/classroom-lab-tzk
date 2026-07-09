# Classroom Lab tzk

以 GitHub Pages 發布的純前端互動教學工具集。根目錄 `index.html` 是所有工具的入口；各項實驗則以獨立子資料夾維護，方便持續加入新的課堂功能。

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-2ea44f?logo=github)](https://kisaraki.github.io/classroom-lab-tzk/)
[![Static Site](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JavaScript-static-0aa8d8)](#技術架構)

## 線上體驗

- [Classroom Lab 工具總頁](https://kisaraki.github.io/classroom-lab-tzk/)
- [GPS定位實驗室](https://kisaraki.github.io/classroom-lab-tzk/gps_3d/gps_3d.html)

## 目前成果

| 工具 | 狀態 | 路徑 | 用途 |
| --- | --- | --- | --- |
| GPS定位實驗室 | 可使用 | `gps_3d/gps_3d.html` | 以互動式 3D 地球、衛星與測距球面示範 GPS 定位概念 |
| 後續教學工具 | 預留 | 由 `index.html` 新增入口 | 依「一項工具、一個子資料夾」原則擴充 |

GPS定位實驗室目前包括：

- 3D 地球、夜間城市燈光、星空、星系與深空裝飾。
- 可調整衛星數量、經緯度與目標距離的互動控制。
- 11 個解算目標，資料同時包含緯度、經度與海拔。
- 定位完成後顯示目標地理資訊，並播放提示音。
- 獨立的「操作說明」與「公式與原理」視窗。
- GPS 半同步軌道、地球同步軌道與地球靜止軌道的教學內容。
- 桌面與行動裝置的響應式介面。

## 使用方式

1. 從工具總頁進入「GPS定位實驗室」。
2. 選擇解算目標與衛星數量。
3. 設定各衛星的緯度與經度。
4. 調整各衛星的測距值，觀察球面交會情形。
5. 當誤差進入容許範圍時，查看定位結果與地理資訊。

頁面內的「操作說明」提供完整步驟；「公式與原理」則說明三邊定位與衛星軌道概念。

## 技術架構

本專案不需要建置工具或套件管理器，可直接由瀏覽器載入：

- HTML5
- CSS3
- 原生 JavaScript
- [Three.js r128](https://threejs.org/) 與 OrbitControls（由 CDN 載入）
- GitHub Pages

## 專案結構

```text
.
├─ index.html                         # 工具總頁與所有功能入口
├─ assets/
│  └─ css/
│     ├─ shared.css                   # 跨工具共用樣式
│     └─ home.css                     # 總頁專用樣式
├─ gps_3d/
│  ├─ gps_3d.html                     # GPS定位實驗室
│  └─ assets/
│     ├─ gps.css                      # GPS 工具專用樣式
│     └─ gps.js                       # 3D 場景、資料與互動邏輯
├─ .codex/
│  └─ skills/
│     ├─ extend-classroom-lab/
│     │  ├─ SKILL.md                  # 專案維護與擴充規範
│     │  └─ agents/
│     │     └─ openai.yaml
│     └─ publish-to-github/
│        ├─ SKILL.md                  # 安全發布 Skill 入口
│        └─ agents/
│           └─ openai.yaml
├─ publish2Githubs.md                 # GitHub 上傳、風險閘門與驗證流程
├─ .nojekyll                          # GitHub Pages 直接發布靜態檔案
└─ README.md
```

## 本機執行

請使用本機 HTTP 伺服器，避免瀏覽器對 `file://` 資源的限制：

```powershell
py -m http.server 8000
```

啟動後開啟：

- 工具總頁：<http://localhost:8000/>
- GPS定位實驗室：<http://localhost:8000/gps_3d/gps_3d.html>

GPS 頁面會從 CDN 載入 Three.js、OrbitControls 與地球紋理，因此完整使用時需要網路連線。

## GitHub Pages 部署

1. 將變更推送至 GitHub repository 的 `main` 分支。
2. 前往 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**。
4. 選擇 `main` 與 `/ (root)` 後儲存。

站內連結與專案資源應維持相對路徑，確保網站可在 `https://kisaraki.github.io/classroom-lab-tzk/` 這類專案子路徑正確運作。

## 擴充新工具

未來功能一律從根目錄 `index.html` 分支出去：

1. 使用小寫英文、數字與底線建立工具資料夾，例如 `orbit_lab/`。
2. 將入口頁命名為與資料夾相同的 `orbit_lab/orbit_lab.html`。
3. 將工具專用 CSS、JavaScript 與圖片放在 `orbit_lab/assets/`。
4. 只有確定會由多項工具共用的資源，才放在根目錄 `assets/`。
5. 在 `index.html` 新增工具卡片，使用相對路徑 `./orbit_lab/orbit_lab.html`。
6. 在工具頁提供回到 `../index.html` 的導覽。
7. 更新本 README 的成果表與專案結構，並驗證 GitHub Pages 子路徑。

更完整的實作與驗證規則請參考 [專案擴充 Skill](.codex/skills/extend-classroom-lab/SKILL.md)。

## 資料來源與教學限制

- 地球日間與夜間燈光紋理由 [Three.js 範例資源](https://threejs.org/examples/#webgl_materials_normalmap)載入；夜間燈光概念可參考 [NASA Black Marble](https://blackmarble.gsfc.nasa.gov/)。
- 目標位置資料參考 [GeoNames](https://www.geonames.org/) 等公開地理資料。城市海拔是代表點數值，不代表整個行政區皆為相同高度。
- 衛星軌道資料可參考 [GPS.gov](https://www.gps.gov/systems/gps/space/) 與 [NASA](https://earthobservatory.nasa.gov/features/OrbitsCatalog)。
- 本工具用於課堂示範三邊定位與幾何關係，不是實際 GNSS 接收器，也未模擬電離層、時鐘偏差、多路徑或完整最小平方法解算。

## 貢獻

提交新工具或修正時，請維持總頁入口、工具資料夾邊界、相對路徑及響應式介面，並依 `SKILL.md` 的檢查表完成驗證。

## 授權

本專案目前尚未附加開源授權條款。
