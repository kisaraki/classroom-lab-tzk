# Classroom Lab tzk

以 GitHub Pages 發布的純前端互動教學工具集。根目錄 `index.html` 是所有工具的入口；各項實驗則以獨立子資料夾維護，方便持續加入新的課堂功能。

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-2ea44f?logo=github)](https://kisaraki.github.io/classroom-lab-tzk/)
[![Static Site](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JavaScript-static-0aa8d8)](#技術架構)

## 線上體驗

- [Classroom Lab 工具總頁](https://kisaraki.github.io/classroom-lab-tzk/)
- [GPS定位實驗室](https://kisaraki.github.io/classroom-lab-tzk/gps_3d/gps_3d.html)
- [拋體運動實驗室](https://kisaraki.github.io/classroom-lab-tzk/projectilemotion/projectilemotion.html)
- [透鏡成像實驗室](https://kisaraki.github.io/classroom-lab-tzk/lens/lens.html)
- [數字系統研究室](https://kisaraki.github.io/classroom-lab-tzk/son/son.html)

## 目前成果

| 工具 | 狀態 | 路徑 | 用途 |
| --- | --- | --- | --- |
| GPS定位實驗室 | 可使用 | `gps_3d/gps_3d.html` | 以互動式 3D 地球、衛星與測距球面示範 GPS 定位概念 |
| 拋體運動實驗室 | 可使用 | `projectilemotion/projectilemotion.html` | 以互動式方格紙示範斜面拋體運動、角度關係、飛行時間、落點與海拔變化 |
| 透鏡成像實驗室 | 可使用 | `lens/lens.html` | 以互動式光線圖示範凸透鏡、凹透鏡、焦距標示、物距、像距、放大率與成像性質 |
| 數字系統研究室 | 可使用 | `son/son.html` | 以互動式撥盤示範 10、16、8、2 進位、32-bit 整數與二補數表示 |
| 後續教學工具 | 預留 | 由 `index.html` 新增入口 | 依「一項工具、一個子資料夾」原則擴充 |

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
- 右側面板即時顯示焦距、物距、像距、放大率、成像類型、成像方向與成像位置。
- 公式卡同步列出薄透鏡公式、像距計算、放大率與成像判讀。
- 獨立的「操作說明」與「公式與原理」視窗。
- 與網站既有暗色、玻璃面板、深空科技風格一致的響應式介面。

數字系統研究室目前包括：

- 純 HTML/CSS/JavaScript 製作，可直接部署到 GitHub Pages。
- 以四個同步面板顯示同一個 32-bit 整數的 10 進位、16 進位、8 進位與 2 進位表示。
- 每個面板提供 8 位機械式撥盤、直接輸入框、`+1`、`-1`、`MAX` 與 `RESET` 操作。
- 10 進位使用 signed integer；16、8、2 進位使用 unsigned 32-bit two's complement 方式顯示。
- 右側儀表燈號顯示 `ERR`、`OVF`、`NEG`，用來觀察輸入錯誤、顯示溢位與負數狀態。
- 頁面上方即時顯示 signed decimal、unsigned 32-bit、hex 32-bit 與 binary low 8 的總覽數值。
- 獨立的「操作說明」與「公式與原理」視窗。
- 與網站既有暗色、玻璃面板、深空科技風格一致的響應式介面。

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
5. 查看右側資料面板中的像距 q、放大率 M、成像類型與成像方向。
6. 開啟「公式與原理」查看薄透鏡公式與教學限制。

數字系統研究室：

1. 在任一進位制面板中使用上下箭頭調整指定位數。
2. 觀察其他進位制面板如何同步更新為同一個 32-bit 整數。
3. 使用輸入框直接輸入 10 進位、16 進位、8 進位或 2 進位數字。
4. 觀察 `ERR`、`OVF`、`NEG` 燈號，理解格式錯誤、顯示溢位與負數補數表示。
5. 使用 `MAX`、`RESET` 或「示範組合」快速切換代表性數值。
6. 開啟「公式與原理」查看位值概念、signed / unsigned 與 two's complement 說明。

各工具頁面內的「操作說明」提供完整步驟；「公式與原理」則整理對應的教學概念。

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
- 拋體運動實驗室：<http://localhost:8000/projectilemotion/projectilemotion.html>
- 透鏡成像實驗室：<http://localhost:8000/lens/lens.html>
- 數字系統研究室：<http://localhost:8000/son/son.html>

GPS 頁面會從 CDN 載入 Three.js、OrbitControls 與地球紋理，因此完整使用時需要網路連線。拋體運動、透鏡成像與數字系統頁面不依賴外部 CDN。

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
- 數字系統研究室採用 JavaScript 32-bit signed integer 行為示範進位制與 two's complement；二進位面板只顯示低 8 位，八進位面板顯示 8 位，超出面板可完整呈現的範圍時會以 `OVF` 燈號提示。

## 貢獻

提交新工具或修正時，請維持總頁入口、工具資料夾邊界、相對路徑及響應式介面，並依上述擴充規則完成驗證。

## 授權

本專案目前尚未附加開源授權條款。
