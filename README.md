# Classroom Lab tzk

> **KOSMOS TOOLKIT｜探真拓知酷**

為科學課堂打造、以 GitHub Pages 發布的純前端互動實驗工具集。根目錄 `index.html` 是所有工具的入口；各項實驗則以獨立子資料夾維護，方便持續加入新的課堂功能。

`Classroom Lab tzk` 是專案名稱，其中 `tzk` 保留作者名稱識別；主頁以 `KOSMOS TOOLKIT` 作為工具集標誌，並以「探真拓知酷」作為中文副標。

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-2ea44f?logo=github)](https://kisaraki.github.io/classroom-lab-tzk/)
[![Static Site](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JavaScript-static-0aa8d8)](#技術架構)
[![License: MIT](https://img.shields.io/badge/License-MIT-ffc75a.svg)](./LICENSE)

## 線上體驗

- [KOSMOS TOOLKIT 工具總頁](https://kisaraki.github.io/classroom-lab-tzk/)
- [GPS定位實驗室](https://kisaraki.github.io/classroom-lab-tzk/gps_3d/gps_3d.html)
- [拋體運動實驗室](https://kisaraki.github.io/classroom-lab-tzk/projectilemotion/projectilemotion.html)
- [透鏡成像實驗室](https://kisaraki.github.io/classroom-lab-tzk/lens/lens.html)
- [數字系統研究室](https://kisaraki.github.io/classroom-lab-tzk/son/son.html)
- [三角函數實驗室](https://kisaraki.github.io/classroom-lab-tzk/trigfun/trigfun.html)
- [軌道觀測站](https://kisaraki.github.io/classroom-lab-tzk/ogo/ogo.html)

## 目前成果

| 工具 | 狀態 | 路徑 | 用途 |
| --- | --- | --- | --- |
| GPS定位實驗室 | STABLE | `gps_3d/gps_3d.html` | 以互動式 3D 地球、衛星與測距球面示範 GPS 定位概念 |
| 拋體運動實驗室 | beta | `projectilemotion/projectilemotion.html` | 以互動式方格紙示範斜面拋體運動、角度關係、飛行時間、落點與海拔變化 |
| 透鏡成像實驗室 | STABLE | `lens/lens.html` | 以互動式光線圖示範凸透鏡、凹透鏡、焦距標示、物距、像距、放大率與成像性質 |
| 數字系統研究室 | STABLE | `son/son.html` | 以互動式撥盤示範 10、16、8、2 進位、32-bit 整數與二補數表示 |
| 三角函數實驗室 | STABLE | `trigfun/trigfun.html` | 以單位圓、Magic Hexagon 與六個週期波形探索廣義角及六種三角函數 |
| 軌道觀測站 | STABLE | `ogo/ogo.html` | 同步操作地日公轉、月地相位、月相與季節溫度教學模型 |
| 後續教學工具 | COMING SOON | 由 `index.html` 新增入口 | 依「一項工具、一個子資料夾」原則擴充 |

狀態徽章定義：`STABLE` 表示主要功能與頁面結構已穩定；`beta` 表示可操作但模型或介面仍可能調整；`COMING SOON` 是尚未建立工具入口的擴充預留位。

## 今日進度（2026-07-11）

- 將手動加入的 `ogo/` 原型重建為可直接由 GitHub Pages 執行的「軌道觀測站」，並加入工具總頁。
- 完成地日軌道、月地相位、月相、事件樣本與五城市季節溫度的同步操作；地日軌道加入春分點、夏至點、秋分點及冬至點。
- 修正 3D 場景長時間顯示載入訊息的問題，加入臺北觀測基準、兩個場景各自的「視角重設」、六種面板底色與微光、日全蝕／日偏蝕遮擋，以及月蝕樣本日的紅銅色月光。
- 將事件清單縮小為所選日期前後 10 日，擴充流星雨、衝、東大距、西大距與彗星事件；加入地球附近的流星線條及帶有背日彗尾的彗星教學動態。所有事件均分列觀測條件與可觀測區域；2025–2026 沒有行星凌日，因此誠實列出下一次水星凌日 2032-11-13 作為範圍外參考。
- 為氣溫模型加入載入時與日期變更時的缺漏檢查、Open-Meteo 補值、來源標示、部分資料防護、請求節流、逾時與一次自動重試。
- 完成軌道觀測站的操作說明、模型限制與外部資料說明，並將工具總頁及本文件中的狀態提升為 `STABLE`。

GPS定位實驗室目前包括：

- 3D 地球、夜間城市燈光、星空、星系與深空裝飾。
- 可調整衛星數量、經緯度與目標距離的互動控制。
- 11 個解算目標，資料同時包含緯度、經度與海拔。
- 定位完成後顯示目標地理資訊，並播放提示音。
- 獨立的「操作說明」與「公式與原理」視窗。
- GPS 半同步軌道、地球同步軌道與地球靜止軌道的教學內容。
- 桌面與行動裝置的響應式介面。

拋體運動實驗室目前包括：

- 純 HTML/CSS/JavaScript 製作，可直接部署到 GitHub Pages。
- 可調整初速、發射角、斜面角與發射點海拔；預設值為初速 50 m/s、發射角 45°、斜面角 0°、發射點海拔 0 m。
- 斜面角可在 -90° 到 90° 之間調整，並對垂直斜面與大角度斜面做繪圖防護。
- 以 Canvas 即時繪製方格紙、斜面、發射向量、P 點水平參考線、拋物線軌跡、落點與 P→T 斜面直線距離。
- 在方格紙下方顯示解算結果，包括飛行時間、水平距離 X、升降高度 Y、P→T 斜面直線距離、最高點海拔與落點海拔。
- 右側面板即時顯示 8 個國中程度公式卡，每列 2 個公式區塊，共 4 列呈現，滑桿變動時同步更新代入數值。
- 「觀察重點」顯示在方格紙區，方便一邊操作一邊對照角度與高度變化。
- 獨立的「操作說明」與「公式與原理」視窗。
- 與網站既有暗色、玻璃面板、深空科技風格一致的響應式介面。

透鏡成像實驗室目前包括：

- 純 HTML/CSS/JavaScript 製作，可直接部署到 GitHub Pages。
- 可切換凸透鏡與凹透鏡，並以焦距倍數調整物距。
- 以 SVG 即時繪製光軸、薄透鏡符號、焦點、物體、成像位置與三條主光線，避免使用不易判讀的透鏡弧線。
- 光軸焦距標示採小寫 `f` 與 `f'`，並包含 `0.5f`、`0.5f'`、`1.5f`、`2f`、`2.5f` 等參考點。
- 實線表示實際光線，虛線表示反向延長線；實像與虛像使用不同顏色與線型呈現。
- 當成像位置超出可視範圍時，會在畫面中以醒目提示標示「成像在右側遠方」或「成像在左側遠方」。
- 右側面板即時顯示焦距、物距、像距、放大率、成像類型、成像方向與成像位置；其中像距 `q` 以右側焦距單位 `f'` 表示。
- 公式卡同步列出薄透鏡公式、像距計算、放大率與成像判讀。
- 獨立的「操作說明」與「公式與原理」視窗。
- 與網站既有暗色、玻璃面板、深空科技風格一致的響應式介面。

數字系統研究室目前包括：

- 純 HTML/CSS/JavaScript 製作，可直接部署到 GitHub Pages。
- 以四個同步面板顯示同一個 32-bit 整數的 10 進位、16 進位、8 進位與 2 進位表示。
- 每個面板提供 8 位機械式撥盤、直接輸入框、`+1`、`-1`、`MAX` 與 `RESET` 操作。
- 10 進位使用 signed integer；16、8、2 進位使用 unsigned 32-bit two's complement 方式顯示。
- 右側儀表燈號顯示 `ERR`、`OVF`、`NEG`，用來觀察輸入錯誤、顯示溢位與負數狀態。
- 頁面上方即時顯示 signed decimal、unsigned 32-bit、hex 32-bit 與 binary 32-bit 的總覽數值；二進位數字由第 32 位至第 1 位排列，並以每 8 位一組顯示。
- 獨立的「操作說明」與「公式與原理」視窗。
- 與網站既有暗色、玻璃面板、深空科技風格一致的響應式介面。

三角函數實驗室目前包括：

- 純 HTML/CSS/JavaScript 製作，可直接部署到 GitHub Pages。
- 可拖曳單位圓上的 P 點，或使用鍵盤方向鍵改變廣義角，範圍為正負 10 圈；極座標原點標示為 `O`。
- 即時顯示廣義角 `θ₀` 與同界角公式 `θ = 圈數 × k + θ₀`；座標資訊依 a、b、c 排列，一般數據顯示至小數點後兩位。
- 可將整頁角度讀值、單位圓固定角標、快速按鈕與波形刻度切換為度度量或徑度量。
- 單位圓固定標示 0°、45°、90°、135°、180°、225°、270°、315°；徑度量模式分別顯示 `0π`、`π/4`、`π/2`、`3π/4`、`π`、`5π/4`、`3π/2`、`7π/4`。
- 提供 ±30°、±45°、±60° 快速角度按鈕，可在單位圓 c 的目前角度上累加指定角度；快速區塊採獨立珊瑚紅色，徑度量模式同步顯示 π 分數。
- Magic Hexagon 以六角配置同步呈現 sin、cos、tan、cot、sec、csc 的定義與函數值；六個三角區域交錯著色，函數六角節點、三角區域、外框與中央圓均具微光邊緣。
- Magic Hexagon 同時整理三組對角倒數關係，以及 `sin²θ + cos²θ = 1`、`1 + tan²θ = sec²θ`、`1 + cot²θ = csc²θ` 三組平方關係。
- 六張不同代表色與微光邊緣的週期圖追蹤目前同界角位置；上排依序為 sin、cos、tan，下排依序為 csc、sec、cot，分母為 0 時顯示「未定義」。
- 只有精確落在特殊角時才以根號形式顯示，避免將鄰近角度誤標成精確值。
- 獨立的「操作說明」與「公式與原理」視窗，以及響應式深空科技介面。

軌道觀測站目前包括：

- 以獨立的 `ogo.html`、`ogo.css`、`ogo.js` 組成，可直接由 GitHub Pages 發布，不使用 Tailwind 或建置工具。
- 日期範圍涵蓋 2025-01-01 至 2026-12-31，可使用年月日選單、日期滑桿及 ±1 日按鈕同步控制全頁。
- 以 Three.js 顯示地日與月地兩個 3D 教學場景；可拖曳軌道或月球改變日期，也可拖曳地球改變自轉視角。
- 地日與月地場景各有獨立的「視角重設」按鈕，可恢復相機位置、朝向與縮放。
- 地日模型加入約 23.4° 地軸傾角、近日點與遠日點附近標示，以及春分點、夏至點、秋分點、冬至點四個發光季節節點；事件資料標記為日全蝕且日期完全相符時，太陽會被完整遮擋並顯示日冕微光，日偏蝕樣本則只遮擋部分圓面。月地模型以固定太陽光方向示範月相幾何。
- 摘要面板同步顯示公曆、農曆近似、月相與臺北季節；月相區標示「以臺北為觀測基準」，並以無外框、柔和微光的 Canvas 繪製目前月相。事件資料標記為月蝕且日期完全相符時，Canvas 與月地 3D 模型中的月球同步改為紅銅色；一般滿月不會套用月蝕色彩。
- 日期控制、地日、月地、觀測摘要、月相事件與季節溫度六個主要面板採不同深色底調，邊緣使用各自代表色的低強度微光。
- 天文事件清單顯示所選日期前後 10 日的樣本，類型包括日月蝕、流星雨、衝、東大距、西大距與彗星；同日或相近日期的事件會依日期排序並使用不同代表色。每筆事件均以獨立欄位列出可觀測區域，並把時段、方位、器材或安全條件分開呈現；不受日期篩選的 2032 水星凌日範圍外資料則收納於「模型與原理」，不與主畫面的空事件狀態混列。
- 流星雨在極大日前後 1 日顯示地球附近的流星線條；3I/ATLAS 最近地球日前後 10 日顯示移動彗核與背日彗尾。動畫只用於辨識事件類型，不代表真實數量、軌道或天空位置。
- 顯示臺北、羅馬、華盛頓、墨爾本、聖地牙哥的可重現季節溫度訊號；臺北另以藍底白字微光徽章標為「觀測基準」。
- 所有軌道、比例、曆法、事件與溫度資料均清楚標示為教育模型；本地溫度遇到缺漏時，會自動嘗試以 Open-Meteo 歷史資料或近期預報補足並標示來源，超出預報範圍的未來日期仍保留缺漏。
- 具備獨立的「操作說明」與「模型與原理」視窗、返回工具總頁導覽，以及與本站一致的響應式深空科技介面。

## 使用方式

從工具總頁進入指定實驗後，依各頁面的操作說明進行探索。

GPS定位實驗室：

1. 選擇解算目標與衛星數量。
2. 設定各衛星的緯度與經度。
3. 調整各衛星的測距值，觀察球面交會情形。
4. 當誤差進入容許範圍時，查看定位結果與地理資訊。

拋體運動實驗室：

1. 調整初速、發射角、斜面角與發射點海拔。
2. 觀察 Canvas 中的發射向量、P 點水平參考線、斜面、拋物線軌跡與落點。
3. 查看方格紙下方的飛行時間、水平距離 X、升降高度 Y、P→T 斜面直線距離、最高點海拔與落點海拔。
4. 對照右側「即時計算公式」區，觀察參數變化如何影響各步公式。
5. 開啟「公式與原理」查看模型假設與教學限制。

透鏡成像實驗室：

1. 選擇凸透鏡或凹透鏡。
2. 拖曳物距滑桿，改變物體距離透鏡中心的遠近。
3. 對照光軸上的 `f`、`f'`、`0.5f`、`0.5f'` 等標記，觀察物體與焦點的相對位置。
4. 觀察光線圖中的 L1、L2、L3 三條主光線，以及實像或虛像的位置；若成像超出畫面，請依遠方提示判讀方向。
5. 查看右側資料面板中以 `f'` 表示的像距 q，以及放大率 M、成像類型與成像方向。
6. 開啟「公式與原理」查看薄透鏡公式與教學限制。

數字系統研究室：

1. 在任一進位制面板中使用上下箭頭調整指定位數。
2. 觀察其他進位制面板如何同步更新為同一個 32-bit 整數。
3. 使用輸入框直接輸入 10 進位、16 進位、8 進位或 2 進位數字。
4. 觀察 `ERR`、`OVF`、`NEG` 燈號，理解格式錯誤、顯示溢位與負數補數表示。
5. 使用 `MAX`、`RESET` 或「示範組合」快速切換代表性數值。
6. 開啟「公式與原理」查看位值概念、signed / unsigned 與 two's complement 說明。

三角函數實驗室：

1. 拖曳單位圓上的 P 點改變角度；跨越 0° 時會繼續累計廣義角，也可用方向鍵微調。
2. 使用角度單位按鈕切換度度量與徑度量，觀察固定特殊角、即時角度、同界角公式與波形刻度如何同步改變。
3. 觀察動態同界角公式中的圈數、整數係數與 `θ₀`，並依序查看 P(a, b) 的 a、b 投影及單位圓半徑 c。
4. 使用 ±30°、±45°、±60° 快速角度按鈕，在 c 的目前角度上累加指定角度。
5. 對照 Magic Hexagon，理解六種三角函數的定義、倒數關係與平方關係。
6. 查看六張週期圖上的同步標記，觀察函數值與未定義位置。
7. 開啟「公式與原理」查看單位圓公式與模型說明。

軌道觀測站：

1. 使用年月日選單、日期滑桿或 ±1 日按鈕設定日期。
2. 在地日場景拖曳軌道改變日期、拖曳地球改變自轉偏移，或在空白處旋轉鏡頭。
3. 在月地場景拖曳月球，將日期移至鄰近的目標月相。
4. 使用各場景右上角的「視角重設」，恢復初始相機位置與朝向。
5. 對照前後 10 日事件清單，觀察日月蝕、流星雨、衝、大距與彗星樣本；選到流星雨或彗星活動視窗時，地日場景會顯示教學動態與事件徽章。
6. 對照公曆、農曆近似、月相及不同緯度城市的季節溫度訊號；若看到「遠端補值」，表示本地缺漏已由 Open-Meteo 補足。
7. 開啟「模型與原理」，確認圓形軌道、事件樣本、非等比例天體、近似曆法及模擬氣象等限制。

各工具頁面內的「操作說明」提供完整步驟；「公式與原理」則整理對應的教學概念。

## 技術架構

本專案不需要建置工具或套件管理器，可直接由瀏覽器載入：

- HTML5
- CSS3
- 原生 JavaScript
- [Three.js r128](https://threejs.org/) 與 OrbitControls（由 CDN 載入）
- [Open-Meteo](https://open-meteo.com/)（僅在軌道觀測站偵測到氣溫缺漏時使用）
- GitHub Pages

## 外部 API 與資料庫調用

經全專案程式碼掃描，目前只有「軌道觀測站」會在瀏覽器執行期間以 `fetch()` 查詢外部數值資料。它透過 Open-Meteo 的公開 REST API 讀取天氣資料集；本專案沒有自己的遠端資料庫、後端伺服器或使用者帳號系統。

### 執行期 API 清單

| 服務 | HTTPS 端點 | 方法與格式 | 用途 |
| --- | --- | --- | --- |
| [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) | `https://archive-api.open-meteo.com/v1/archive` | `GET`、JSON | 本地氣溫模型出現缺漏，而且所選日期為當日或過去日期時，查詢歷史再分析格點資料 |
| [Open-Meteo Forecast API](https://open-meteo.com/en/docs) | `https://api.open-meteo.com/v1/forecast` | `GET`、JSON | 本地氣溫模型出現缺漏，而且所選日期在未來 15 日內時，查詢近期預報 |

實作位置為 [`ogo/assets/ogo.js`](ogo/assets/ogo.js)。每次請求只傳送以下查詢參數：

| 參數 | 本專案送出的內容 |
| --- | --- |
| `latitude`、`longitude` | 臺北、羅馬、華盛頓、墨爾本、聖地牙哥五個預先寫入程式的座標，以逗號分隔後一次查詢 |
| `start_date`、`end_date` | 使用者目前在模擬器選取的同一個日期 |
| `daily` | `temperature_2m_mean`，每日 2 公尺平均氣溫 |
| `timezone` | `auto`，由服務依各座標決定當地時區 |

程式只讀取回應中的 `daily.temperature_2m_mean[0]`。這些資料是數值天氣模型的格點再分析或預報，不是城市測站實測，也不會回寫或改變本地教育模型。

### 呼叫條件與失敗處理

1. 目前教學資料在 2026-06-30 以前使用本地週期模型；自 2026-07-01 起刻意回傳缺漏，用來示範遠端補值流程。未偵測到缺漏時不會呼叫 API。
2. 頁面載入及日期改變時先檢查本地資料；有效值直接使用，不會發出 API 請求。
3. `null`、`undefined`、空字串及非有限數值視為缺漏；數值 `0` 是有效資料，不得當作缺漏，也不會把遠端 `null` 轉換成 `0 °C`。
4. 當日與過去日期使用 Historical Weather API；未來 1 至 15 日使用 Forecast API。更遠的未來日期不呼叫 API，直接保留 `---`。
5. 日期拖曳停止 320 ms 後才送出請求；切換日期會取消已失去用途的舊請求，避免快速操作造成大量查詢。
6. 單次請求的逾時為 12 秒；第一次失敗會在 15 秒後自動重試一次，第二次仍失敗便保留可操作介面與缺漏標示。
7. 成功結果只保存在目前頁面的記憶體快取中，重新載入頁面即清除；本專案不使用 Cookie、`localStorage` 或遠端資料庫保存 API 回應。
8. 五個城市只有部分取得資料時顯示 `PARTIAL` 與實際補值城市數；未取得者保留 `---`，平均值只採用確實取得的城市並標為「N 城補值平均」。

### 金鑰、隱私與授權

- 現行免費端點不傳送 API 金鑰、登入資訊或使用者輸入的位置；請求內容只有五個固定城市座標與模擬器所選日期。
- 瀏覽器會直接連線 Open-Meteo，因此服務端仍可能取得一般 HTTP 連線資訊，例如 IP 位址、來源網址及瀏覽器標頭；詳見 [Open-Meteo Terms & Privacy](https://open-meteo.com/en/terms)。
- Open-Meteo API 資料依 [CC BY 4.0](https://open-meteo.com/en/license) 提供並要求標示來源。本站在氣溫面板與文件中標明 Open-Meteo；專案的 MIT License 不會取代外部資料原有的授權條件。
- GitHub Pages 是純前端環境，只能直接呼叫支援 HTTPS 與 CORS 的公開服務。未來若使用需要私密金鑰的 API，不得把金鑰寫入 HTML 或 JavaScript，必須改由安全的後端代理處理。

### 已確認不會在執行時調用的資料來源

- NASA、NASA/JPL Horizons、GPS.gov 與 GeoNames 僅用於開發時校核或文件引用；座標、天文事件及教學參數已固化在本地檔案，瀏覽器不會向這些網站查詢數值。
- Three.js CDN、OrbitControls、地球與月球紋理屬靜態程式或圖片下載，不是資料庫 API。
- 拋體運動、透鏡成像、數字系統與三角函數實驗室完全在瀏覽器本機計算，沒有外部 API、分析服務或遠端儲存。

未來新增外部資料服務時，應同步更新本章，並沿用「本地值優先、明確判定缺漏、不以 0 代替空值、標示來源與單位、快取與限制請求、失敗時保留可操作介面、不虛構補值」原則。

## 外部靜態資源與失敗策略

本專案另有少量執行期靜態資源。這些請求只下載程式庫、控制器或圖片，不會查詢外部數值資料庫。

| 工具 | 執行時外部靜態資源 | 本地資料與失敗處理 |
| --- | --- | --- |
| GPS定位實驗室 | CDN 上的 Three.js、OrbitControls，以及 Three.js 地球日間／夜燈紋理 | 11 組目標經緯度、海拔與軌道參數均保存在本地；紋理失敗時保留地球基礎材質，核心 3D 程式庫失敗時需恢復網路後重新整理 |
| 軌道觀測站 | CDN 上的 Three.js、OrbitControls，以及遠端地球／月球紋理 | 天文事件與教學參數均保存在本地；紋理失敗時保留基礎色材質，氣溫 API 另依前章策略處理 |
| 拋體運動、透鏡成像、數字系統、三角函數 | 無外部 CDN 或遠端素材 | 所有介面、公式與結果均由本地檔案提供 |

若未來需要完全離線或長期固定的課堂版本，應將 Three.js、OrbitControls 與天體紋理移入專案資源，或改用不可變版本網址與完整性檢查，避免外部路徑變更影響上課。GPS定位實驗室在尚未完成解算時顯示的 `--` 是「尚無解算結果」，不是外部資料缺漏，也不會觸發網路請求。

## 專案結構

```text
.
├─ index.html                         # KOSMOS TOOLKIT 工具總頁與所有功能入口
├─ assets/
│  └─ css/
│     ├─ shared.css                   # 跨工具共用樣式
│     └─ home.css                     # 總頁專用樣式
├─ gps_3d/
│  ├─ gps_3d.html                     # GPS定位實驗室
│  └─ assets/
│     ├─ gps.css                      # GPS 工具專用樣式
│     └─ gps.js                       # 3D 場景、資料與互動邏輯
├─ projectilemotion/
│  ├─ projectilemotion.html           # 拋體運動實驗室
│  └─ assets/
│     ├─ projectilemotion.css         # 拋體運動工具專用樣式
│     └─ projectilemotion.js          # Canvas 繪圖、參數控制與公式解算
├─ lens/
│  ├─ lens.html                       # 透鏡成像實驗室
│  └─ assets/
│     ├─ lens.css                     # 透鏡工具專用樣式
│     └─ lens.js                      # SVG 光線圖、參數控制與薄透鏡解算
├─ son/
│  ├─ son.html                        # 數字系統研究室
│  └─ assets/
│     ├─ son.css                      # 數字系統工具專用樣式
│     └─ son.js                       # 進位制面板、撥盤控制與 32-bit 解算
├─ trigfun/
│  ├─ trigfun.html                    # 三角函數實驗室
│  └─ assets/
│     ├─ trigfun.css                  # 三角函數工具專用樣式
│     └─ trigfun.js                   # 單位圓、六函數與週期波形互動
├─ ogo/
│  ├─ ogo.html                        # 軌道觀測站
│  └─ assets/
│     ├─ ogo.css                      # 軌道觀測站專用樣式
│     └─ ogo.js                       # 雙 3D 場景、日期、月相、天文事件動態、季節訊號與缺漏補值
├─ .nojekyll                          # GitHub Pages 直接發布靜態檔案
├─ LICENSE                            # MIT License
└─ README.md
```

## 本機執行

請使用本機 HTTP 伺服器，避免瀏覽器對 `file://` 資源的限制：

```powershell
py -m http.server 8000
```

啟動後開啟：

- KOSMOS TOOLKIT 工具總頁：<http://localhost:8000/>
- GPS定位實驗室：<http://localhost:8000/gps_3d/gps_3d.html>
- 拋體運動實驗室：<http://localhost:8000/projectilemotion/projectilemotion.html>
- 透鏡成像實驗室：<http://localhost:8000/lens/lens.html>
- 數字系統研究室：<http://localhost:8000/son/son.html>
- 三角函數實驗室：<http://localhost:8000/trigfun/trigfun.html>
- 軌道觀測站：<http://localhost:8000/ogo/ogo.html>

GPS定位實驗室與軌道觀測站會從 CDN 載入 Three.js、OrbitControls 及天體紋理；軌道觀測站另會在偵測到溫度缺漏時查詢 Open-Meteo，因此完整使用時需要網路連線。拋體運動、透鏡成像、數字系統與三角函數頁面不依賴外部 CDN。

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
5. 若新工具先以 React、TypeScript 或其他原型檔製作，需轉換為純靜態 HTML/CSS/JavaScript 後再發布；原型檔只作本機參考，不列入 GitHub Pages 正式檔案。
6. 在 `index.html` 新增工具卡片，使用相對路徑 `./orbit_lab/orbit_lab.html`。
7. 在工具頁提供回到 `../index.html` 的導覽。
8. 更新本 README 的成果表與專案結構，並驗證 GitHub Pages 子路徑。

## 資料來源與教學限制

- 地球日間與夜間燈光紋理由 [Three.js 範例資源](https://threejs.org/examples/#webgl_materials_normalmap)載入；夜間燈光概念可參考 [NASA Black Marble](https://blackmarble.gsfc.nasa.gov/)。
- 目標位置資料參考 [GeoNames](https://www.geonames.org/) 等公開地理資料。城市海拔是代表點數值，不代表整個行政區皆為相同高度。
- 衛星軌道資料可參考 [GPS.gov](https://www.gps.gov/systems/gps/space/) 與 [NASA](https://earthobservatory.nasa.gov/features/OrbitsCatalog)。
- 本工具用於課堂示範三邊定位與幾何關係，不是實際 GNSS 接收器，也未模擬電離層、時鐘偏差、多路徑或完整最小平方法解算。
- 拋體運動實驗室採用理想模型，忽略空氣阻力、風、彈體旋轉、地球曲率與真實外彈道，只用於課堂說明等加速度運動與斜面交會。角度顯示一律使用度；θ = ±90° 時斜面為垂直線，公式中的 `cos(θ)` 與 `tan(θ)` 不適用，因此頁面會以教學防護方式顯示為無有效交會。
- 透鏡成像實驗室採用理想薄透鏡模型，未模擬透鏡厚度、像差、光圈、色散、繞射或真實相機感光面。凸透鏡焦距以正值表示，凹透鏡焦距以負值表示；光軸標記以小寫 `f` 與 `f'` 表示左右焦距位置。城市與 GPS 資料無關的光學示範不需外部資料來源。
- 數字系統研究室採用 JavaScript 32-bit signed integer 行為示範進位制與 two's complement；操作用二進位撥盤面板顯示低 8 位，上方總覽則以四組 8 位數字顯示完整 32 位。八進位面板顯示 8 位，超出面板可完整呈現的範圍時會以 `OVF` 燈號提示。
- 三角函數實驗室以單位圓作為教學模型，角度介面可切換度度量與徑度量；整數角的徑度量會約分成 π 分數，一般數據顯示至小數點後兩位。程式內部由瀏覽器數學函式計算，圖形與小數為視覺化近似值，特殊根號值只在精確特殊角顯示。
- 軌道觀測站用圓形、等速軌道近似地球公轉與月球相位，天體大小及距離並非等比例；未完整計算軌道離心率、克卜勒速率變化、月球軌道傾角、歲差、章動或日月蝕幾何。日蝕遮擋、月蝕紅銅色、流星雨與彗星動畫均由事件樣本日期觸發，不是天體幾何或粒子軌跡即時計算。29.53059 日月相週期、地軸傾角與軌道背景可參考 [NASA Moon Phases](https://science.nasa.gov/moon/moon-phases/)、[NASA Orbits and Kepler’s Laws](https://science.nasa.gov/solar-system/orbits-and-keplers-laws/) 與 [NASA Earth Facts](https://science.nasa.gov/earth/facts/)。
- 流星雨日期與可見半球參考 [NASA Meteor Showers](https://science.nasa.gov/solar-system/meteors-meteorites/facts/)；其中寶瓶座 η 流星雨採用較專門的 [NASA Eta Aquariids](https://science.nasa.gov/solar-system/meteors-meteorites/eta-aquarids/) 頁面，以 2025-05-05 至 05-06 為峰值夜。月蝕區域依 [NASA 2025 月全蝕](https://science.nasa.gov/solar-system/moon/what-you-need-to-know-about-the-march-2025-total-lunar-eclipse/) 與 [NASA 2026 月全蝕](https://science.nasa.gov/solar-system/moon/march-2026-total-lunar-eclipse-your-questions-answered/) 資料，日蝕區域依 [NASA Solar Eclipse Decade Table](https://eclipse.gsfc.nasa.gov/SEdecade/SEdecade2021.html)。3I/ATLAS 最近地球日期與觀測條件參考 [NASA 3I/ATLAS Skywatching](https://science.nasa.gov/solar-system/skywatching/whats-up-december-2025-skywatching-tips-from-nasa/)；衝與大距日期由 [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) 地心太陽距角日資料選取局部或年度最大值。2025–2026 沒有水星或金星凌日，下一次水星凌日 2032-11-13 參考 [NASA Mercury Transit Catalog](https://eclipse.gsfc.nasa.gov/transit/catalog/MercuryCatalog.html) 與 [NASA Transit Visibility](https://eclipse.gsfc.nasa.gov/transit/catalog/Visible.html) 的接觸時刻及可見性計算方式。
- 軌道觀測站的農曆月份表、等間隔節氣、天文事件清單與週期溫度皆為教學近似或事件樣本，不是正式曆算、觀測預報或行程決策資料。同一日期的本地模擬溫度可重現；缺漏時才查詢 [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) 或近期 Forecast API。歷史資料屬再分析格點值、近期資料屬預報值，皆不等同城市測站實測；超出預報範圍的未來日期不會虛構補值。

## 貢獻

提交新工具或修正時，請維持總頁入口、工具資料夾邊界、相對路徑及響應式介面，並依上述擴充規則完成驗證。

## 授權

除另有註明的第三方函式庫、資料與素材外，本專案原創程式碼以 [MIT License](./LICENSE) 授權，著作權標示為 `Copyright (c) 2026 tzk`。

MIT License 允許使用、複製、修改、合併、發布、散布、再授權與販售軟體副本，但必須保留原始著作權與授權聲明；軟體按現狀提供，不附帶任何明示或默示擔保。第三方資源仍依其各自的授權或使用條款辦理。
