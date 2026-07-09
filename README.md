# Classroom Lab tzk

適合部署至 GitHub Pages 的純靜態互動教學網站。

## 頁面

- `index.html`：工具總頁，可持續新增實驗卡片。
- `gps_3d/gps_3d.html`：GPS 3D 衛星定位教學模擬器。

## GitHub Pages

1. 將此目錄推送至 GitHub repository。
2. 在 repository 的 **Settings → Pages** 選擇 **Deploy from a branch**。
3. 選擇要發布的 branch 與根目錄 `/ (root)`。

所有站內連結與靜態資源皆使用相對路徑，可直接部署在 GitHub Pages 的專案子路徑。

## 專案結構

```text
.
├─ index.html
├─ gps_3d/
│  ├─ gps_3d.html
│  └─ assets/
│     ├─ gps.css
│     └─ gps.js
├─ assets/
│  ├─ css/
│  │  ├─ shared.css
│  │  └─ home.css
└─ .nojekyll
```

GPS 3D 頁面透過 CDN 載入 Three.js r128 與 OrbitControls，因此使用時需要網路連線。

地球日間與夜燈紋理由 Three.js 範例資源載入；夜間燈光資料概念可參考 [NASA Black Marble](https://blackmarble.gsfc.nasa.gov/)。預設地理目標座標參考 [GeoNames](https://www.geonames.org/)。
