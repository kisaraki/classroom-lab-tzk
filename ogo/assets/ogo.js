(() => {
    'use strict';

    const DAY_MS = 86400000;
    const SYNODIC_MONTH = 29.53058867;
    const EVENT_WINDOW_DAYS = 10;
    const MISSING_DISPLAY = '---';
    const EARTH_TEXTURE = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
    const MOON_TEXTURE = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';
    const weatherCache = new Map();
    const weatherPending = new Set();
    const weatherFailed = new Map();
    const weatherAttempts = new Map();
    const weatherRetryTimers = new Map();
    let weatherFetchTimer = null;
    let weatherScheduledDate = '';
    let activeWeatherRequest = null;

    const State = {
        startDate: new Date('2025-01-01T12:00:00Z'),
        endDate: new Date('2026-12-31T12:00:00Z'),
        currentDays: 0,
        earthRotationOffset: 0,
        listeners: [],
        cities: [
            { id:'taipei', name:'臺北', lat:25.03, lon:121.56, base:23, amplitude:8 },
            { id:'rome', name:'羅馬', lat:41.90, lon:12.49, base:16, amplitude:12 },
            { id:'washington', name:'華盛頓', lat:38.90, lon:-77.03, base:14, amplitude:14 },
            { id:'melbourne', name:'墨爾本', lat:-37.81, lon:144.96, base:15, amplitude:8 },
            { id:'sandiego', name:'聖地牙哥', lat:32.71, lon:-117.16, base:18, amplitude:6 }
        ],
        eventSamples: [
            { date:'2025-01-10', kind:'elongation', direction:'east', body:'金星', type:'金星東大距樣本', visible:'當地日落後西方天空 · 地心距日約 47.17°', region:'全球大部分地區；北極極高緯除外' },
            { date:'2025-01-16', kind:'opposition', body:'火星', type:'火星衝樣本', visible:'接近整夜可觀察 · 地心距日約 175.71°', region:'全球大部分地區；北半球仰角較有利，南極高緯除外' },
            { date:'2025-03-14', kind:'lunar-eclipse', type:'月全蝕樣本', visible:'當地月球在地平線上時可直接觀察', region:'美洲及周邊太平洋、大西洋最佳；歐洲西部、非洲西部可見部分階段' },
            { date:'2025-04-22', kind:'meteor-shower', dynamic:'meteor', dynamicWindow:1, dynamicLabel:'天琴座流星雨動態', type:'天琴座流星雨極大樣本', visible:'後半夜至黎明前 · 峰值夜 4/21–22', region:'北半球最佳；赤道以南部分地區亦可觀測' },
            { date:'2025-05-06', kind:'meteor-shower', dynamic:'meteor', dynamicWindow:1, dynamicLabel:'寶瓶座 η 流星雨動態', type:'寶瓶座 η 流星雨極大樣本', visible:'黎明前東方天空 · 峰值夜 5/5–6', region:'南、北半球皆可觀測；南半球較佳，北半球流量較低' },
            { date:'2025-06-01', kind:'elongation', direction:'west', body:'金星', type:'金星西大距樣本', visible:'當地日出前東方天空 · 地心距日約 45.88°', region:'全球大部分地區；南極極高緯除外' },
            { date:'2025-08-12', kind:'meteor-shower', dynamic:'meteor', dynamicWindow:1, dynamicLabel:'英仙座流星雨動態', type:'英仙座流星雨極大樣本', visible:'午夜後至黎明前 · 峰值夜 8/12–13', region:'北半球最佳；南半球低緯度地區可見部分流星' },
            { date:'2025-09-21', kind:'solar-eclipse', coverage:'partial', type:'日偏蝕樣本', visible:'觀測太陽全程須使用合格太陽濾鏡', region:'南太平洋、紐西蘭與南極洲部分地區' },
            { date:'2025-09-21', kind:'opposition', body:'土星', type:'土星衝樣本', visible:'當地夜間接近整夜可觀察 · 地心距日約 177.48°', region:'全球大部分地區；北極極高緯除外' },
            { date:'2025-12-13', kind:'meteor-shower', dynamic:'meteor', dynamicWindow:1, dynamicLabel:'雙子座流星雨動態', type:'雙子座流星雨極大樣本', visible:'晚間至黎明 · 峰值夜 12/13–14', region:'全球皆可觀測；北半球較佳，南半球亦可見' },
            { date:'2025-12-19', kind:'comet', dynamic:'comet', dynamicWindow:10, dynamicLabel:'3I/ATLAS 彗星動態', body:'3I/ATLAS', type:'3I/ATLAS 彗星最近地球樣本', visible:'黎明前東至東北方 · 建議口徑至少約 30 cm 望遠鏡並依當地星曆確認', region:'全球大部分地區；南極極高緯除外' },
            { date:'2026-01-03', kind:'meteor-shower', dynamic:'meteor', dynamicWindow:1, dynamicLabel:'象限儀座流星雨動態', type:'象限儀座流星雨極大樣本', visible:'夜間至黎明前 · 峰值夜 1/3–4', region:'北半球最佳；約南緯 51° 以北仍可能看見' },
            { date:'2026-01-10', kind:'opposition', body:'木星', type:'木星衝樣本', visible:'當地夜間接近整夜可觀察 · 地心距日約 179.51°', region:'全球大部分地區；南極高緯除外' },
            { date:'2026-03-03', kind:'lunar-eclipse', type:'月全蝕樣本', visible:'當地月球在地平線上時可直接觀察', region:'全食可見於東亞、澳洲、太平洋、北美與中美洲及南美洲極西部；中亞與南美洲多數地區可見偏食；歐洲、非洲不可見' },
            { date:'2026-08-12', kind:'solar-eclipse', coverage:'total', type:'日全蝕樣本', visible:'全食帶外及全食前後皆須使用合格太陽濾鏡', region:'全食帶：格陵蘭、冰島、俄羅斯北部、西班牙與葡萄牙極北端一小角；偏食：北美北部、歐洲及非洲西北部' },
            { date:'2032-11-13', kind:'transit', outOfRange:true, body:'水星', type:'水星凌日範圍外參考', visible:'水星黑色小圓盤穿越日面 · 全程須使用合格太陽濾鏡', region:'歐洲、亞洲、澳洲、非洲、南美洲、北美洲南部與東部、南極洲及鄰近海域；部分地區僅可見部分過程' }
        ],
        get maxDays() { return Math.round((this.endDate-this.startDate)/DAY_MS); },
        getDate() { return new Date(this.startDate.getTime()+this.currentDays*DAY_MS); },
        setDays(days) {
            const next=Math.max(0,Math.min(this.maxDays,Math.round(Number(days)||0)));
            if(next===this.currentDays)return;
            this.currentDays=next;
            this.listeners.forEach(listener=>listener());
        },
        subscribe(listener) { this.listeners.push(listener); }
    };

    const lunarMonths = [
        ['2024-12-31','甲辰','臘月'],['2025-01-29','乙巳','正月'],['2025-02-28','乙巳','二月'],['2025-03-29','乙巳','三月'],
        ['2025-04-28','乙巳','四月'],['2025-05-27','乙巳','五月'],['2025-06-25','乙巳','六月'],['2025-07-25','乙巳','閏六月'],
        ['2025-08-23','乙巳','七月'],['2025-09-22','乙巳','八月'],['2025-10-21','乙巳','九月'],['2025-11-20','乙巳','十月'],
        ['2025-12-20','乙巳','十一月'],['2026-01-19','乙巳','臘月'],['2026-02-17','丙午','正月'],['2026-03-19','丙午','二月'],
        ['2026-04-17','丙午','三月'],['2026-05-17','丙午','四月'],['2026-06-15','丙午','五月'],['2026-07-14','丙午','六月'],
        ['2026-08-12','丙午','七月'],['2026-09-11','丙午','八月'],['2026-10-10','丙午','九月'],['2026-11-09','丙午','十月'],
        ['2026-12-08','丙午','十一月'],['2027-01-07','丙午','臘月']
    ].map(([date,year,month])=>({date:new Date(`${date}T12:00:00Z`),year,month}));

    const lunarDayNames = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    const solarTerms = ['小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種','夏至','小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

    const Utils = {
        pad(value) { return String(value).padStart(2,'0'); },
        formatDate(date) { return `${date.getUTCFullYear()}-${this.pad(date.getUTCMonth()+1)}-${this.pad(date.getUTCDate())}`; },
        dayOfYear(date) { return Math.floor((date-Date.UTC(date.getUTCFullYear(),0,1,12))/DAY_MS)+1; },
        daysInYear(year) { return (Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/DAY_MS; },
        daysInMonth(year,monthIndex) { return new Date(Date.UTC(year,monthIndex+1,0)).getUTCDate(); },
        lunarString(date) {
            let current=lunarMonths[0];
            for(const month of lunarMonths){if(date>=month.date)current=month;else break;}
            const day=Math.max(0,Math.min(29,Math.floor((date-current.date)/DAY_MS)));
            return `${current.year}年 ${current.month}${lunarDayNames[day]}`;
        },
        solarTerm(date) {
            const index=Math.floor((this.dayOfYear(date)+4)/15.22)%24;
            return `${solarTerms[index]}（近似）`;
        },
        season(month,lat) {
            let adjusted=month;
            if(lat<0)adjusted=(adjusted+6)%12;
            if(adjusted>=2&&adjusted<=4)return '春季';
            if(adjusted>=5&&adjusted<=7)return '夏季';
            if(adjusted>=8&&adjusted<=10)return '秋季';
            return '冬季';
        },
        hemisphere(lat,lon) { return `${lon>=0?'東':'西'}經半球 · ${lat>=0?'北':'南'}半球`; },
        moonPhase(date) {
            const baseNewMoon=new Date('2025-01-29T12:00:00Z');
            let age=((date-baseNewMoon)/DAY_MS)%SYNODIC_MONTH;
            if(age<0)age+=SYNODIC_MONTH;
            const phase=age/SYNODIC_MONTH;
            let name='殘月';
            if(phase<.03||phase>.97)name='朔月';
            else if(phase<.22)name='眉月';
            else if(phase<.28)name='上弦月';
            else if(phase<.47)name='盈凸月';
            else if(phase<.53)name='滿月';
            else if(phase<.72)name='虧凸月';
            else if(phase<.78)name='下弦月';
            return {phase,age,name};
        },
        temperature(city,date) {
            if(date>=new Date('2026-07-01T12:00:00Z'))return null;
            const day=this.dayOfYear(date);
            const peak=city.lat>=0?205:22;
            const value=city.base+Math.cos((day-peak)/365*Math.PI*2)*city.amplitude;
            return Number(value.toFixed(1));
        },
        globalTemperature(date) {
            if(date>=new Date('2026-07-01T12:00:00Z'))return null;
            const month=date.getUTCMonth();
            const yearOffset=(date.getUTCFullYear()-2025)*.08;
            return Number((14.72+yearOffset+Math.sin((month+1)/12*Math.PI*2)*.18).toFixed(2));
        },
        temperatureColor(value) {
            if(value===null)return '#65788a';
            if(value>=30)return '#ff6b7a';
            if(value>=20)return '#ffc75a';
            if(value>=15)return '#b9ec46';
            return '#39d6f5';
        }
    };

    function populateDateControls() {
        const year=document.querySelector('#dial-year');
        const month=document.querySelector('#dial-month');
        for(let value=2025;value<=2026;value+=1)year.add(new Option(`${value} 年`,value));
        for(let value=1;value<=12;value+=1)month.add(new Option(`${value} 月`,value));
    }

    function syncDayOptions(year,month,selected) {
        const daySelect=document.querySelector('#dial-day');
        const count=Utils.daysInMonth(year,month-1);
        if(daySelect.options.length!==count){
            daySelect.replaceChildren();
            for(let value=1;value<=count;value+=1)daySelect.add(new Option(`${value} 日`,value));
        }
        daySelect.value=Math.min(selected,count);
    }

    function isLunarEclipseDate(date) {
        const dateText=Utils.formatDate(date);
        return State.eventSamples.some(event=>event.kind==='lunar-eclipse'&&event.date===dateText);
    }

    function solarEclipseCoverage(date) {
        const dateText=Utils.formatDate(date);
        return State.eventSamples.find(event=>event.kind==='solar-eclipse'&&event.date===dateText)?.coverage||null;
    }

    function activeDynamicEvents(date) {
        return State.eventSamples.filter(event=>event.dynamic&&Math.abs(new Date(`${event.date}T12:00:00Z`)-date)<=event.dynamicWindow*DAY_MS);
    }

    function drawMoonPhase(phase,isLunarEclipse=false) {
        const canvas=document.querySelector('#moon-phase-canvas');
        const context=canvas.getContext('2d');
        canvas.classList.toggle('is-lunar-eclipse',isLunarEclipse);
        canvas.setAttribute('aria-label',isLunarEclipse?'月蝕樣本日的紅銅色月相示意圖':'目前月相示意圖');
        const size=canvas.width;
        const radius=size*.43;
        const center=size/2;
        const image=context.createImageData(size,size);
        const sun={x:Math.sin(phase*Math.PI*2),z:-Math.cos(phase*Math.PI*2)};
        for(let py=0;py<size;py+=1){
            for(let px=0;px<size;px+=1){
                const x=(px-center)/radius;
                const y=(py-center)/radius;
                const distance=x*x+y*y;
                const index=(py*size+px)*4;
                if(distance>1){image.data[index+3]=0;continue;}
                const z=Math.sqrt(1-distance);
                const lit=x*sun.x+z*sun.z>0;
                const edge=Math.min(1,(1-distance)*12);
                const color=lit?(isLunarEclipse?[191,86,50]:[231,235,220]):(isLunarEclipse?[52,18,18]:[10,18,29]);
                image.data[index]=color[0]; image.data[index+1]=color[1]; image.data[index+2]=color[2]; image.data[index+3]=Math.round(edge*255);
            }
        }
        context.clearRect(0,0,size,size);
        context.putImageData(image,0,0);
    }

    function weatherRequestMode(date) {
        const now=new Date();
        const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
        const target=Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate());
        const difference=Math.round((target-today)/DAY_MS);
        if(difference>15)return null;
        return difference>0?'forecast':'archive';
    }

    function cancelObsoleteWeatherWork(dateText) {
        if(weatherFetchTimer&&weatherScheduledDate!==dateText){
            clearTimeout(weatherFetchTimer);
            weatherFetchTimer=null;
            weatherScheduledDate='';
        }
        if(activeWeatherRequest&&activeWeatherRequest.dateText!==dateText){
            activeWeatherRequest.cancelled=true;
            activeWeatherRequest.controller.abort();
        }
    }

    function scheduleMissingWeather(date) {
        const dateText=Utils.formatDate(date);
        if(!weatherRequestMode(date)||weatherCache.has(dateText)||weatherPending.has(dateText)||weatherFailed.has(dateText)||weatherScheduledDate===dateText)return;
        if(weatherFetchTimer)clearTimeout(weatherFetchTimer);
        weatherScheduledDate=dateText;
        weatherFetchTimer=setTimeout(()=>{
            weatherFetchTimer=null;
            weatherScheduledDate='';
            void fetchMissingWeather(date);
        },320);
    }

    async function fetchMissingWeather(date) {
        const dateText=Utils.formatDate(date);
        const mode=weatherRequestMode(date);
        if(!mode||weatherCache.has(dateText)||weatherPending.has(dateText)||weatherFailed.has(dateText))return;
        weatherPending.add(dateText);
        const controller=new AbortController();
        const request={dateText,controller,cancelled:false};
        activeWeatherRequest=request;
        const timeoutId=setTimeout(()=>controller.abort(),12000);
        if(Utils.formatDate(State.getDate())===dateText)updateUI();
        const parameters=new URLSearchParams({
            latitude:State.cities.map(city=>city.lat).join(','),
            longitude:State.cities.map(city=>city.lon).join(','),
            start_date:dateText,
            end_date:dateText,
            daily:'temperature_2m_mean',
            timezone:'auto'
        });
        const endpoint=mode==='forecast'?'https://api.open-meteo.com/v1/forecast':'https://archive-api.open-meteo.com/v1/archive';
        try {
            const response=await fetch(`${endpoint}?${parameters.toString()}`,{headers:{Accept:'application/json'},signal:controller.signal});
            if(!response.ok)throw new Error(`Open-Meteo HTTP ${response.status}`);
            const payload=await response.json();
            const records=Array.isArray(payload)?payload:[payload];
            const cities={};
            State.cities.forEach((city,index)=>{
                const rawValue=records[index]?.daily?.temperature_2m_mean?.[0];
                const value=rawValue===null||rawValue===undefined||rawValue===''?NaN:Number(rawValue);
                if(Number.isFinite(value))cities[city.id]=value;
            });
            const values=Object.values(cities);
            if(values.length===0)throw new Error('Open-Meteo response contains no daily mean temperature.');
            weatherCache.set(dateText,{cities,average:values.reduce((sum,value)=>sum+value,0)/values.length,count:values.length,complete:values.length===State.cities.length,mode});
            weatherFailed.delete(dateText);
            weatherAttempts.delete(dateText);
        } catch(error) {
            if(!request.cancelled){
                console.warn('Unable to fill missing weather values.',error);
                const attempts=(weatherAttempts.get(dateText)||0)+1;
                weatherAttempts.set(dateText,attempts);
                weatherFailed.set(dateText,{attempts,at:Date.now()});
                if(attempts<2&&!weatherRetryTimers.has(dateText)){
                    const timer=setTimeout(()=>{
                        weatherRetryTimers.delete(dateText);
                        const failure=weatherFailed.get(dateText);
                        if(!failure||failure.attempts!==attempts)return;
                        weatherFailed.delete(dateText);
                        if(Utils.formatDate(State.getDate())===dateText)updateUI();
                    },15000);
                    weatherRetryTimers.set(dateText,timer);
                }
            }
        } finally {
            clearTimeout(timeoutId);
            weatherPending.delete(dateText);
            if(activeWeatherRequest===request)activeWeatherRequest=null;
            if(Utils.formatDate(State.getDate())===dateText)updateUI();
        }
    }

    function updateUI() {
        const date=State.getDate();
        const year=date.getUTCFullYear();
        const month=date.getUTCMonth()+1;
        const day=date.getUTCDate();
        const dateText=Utils.formatDate(date);
        cancelObsoleteWeatherWork(dateText);
        const dayNumber=Utils.dayOfYear(date);
        const phase=Utils.moonPhase(date);
        const lunarEclipseToday=isLunarEclipseDate(date);
        const solarEclipseToday=solarEclipseCoverage(date);

        document.querySelector('#time-slider').value=State.currentDays;
        document.querySelector('#dial-year').value=year;
        document.querySelector('#dial-month').value=month;
        syncDayOptions(year,month,day);
        document.querySelector('#date-status').textContent=`${dateText} · DAY ${String(dayNumber).padStart(3,'0')}`;
        document.querySelector('#overview-date').textContent=dateText;
        document.querySelector('#overview-lunar').textContent=Utils.lunarString(date);
        document.querySelector('#overview-phase').textContent=phase.name;
        document.querySelector('#overview-season').textContent=Utils.season(date.getUTCMonth(),25.03);
        document.querySelector('#moon-phase-name').textContent=phase.name;
        document.querySelector('#moon-age').textContent=`月齡 ${phase.age.toFixed(1)} 日`;
        drawMoonPhase(phase.phase,lunarEclipseToday);
        const solarEclipseIndicator=document.querySelector('#solar-eclipse-indicator');
        solarEclipseIndicator.hidden=!solarEclipseToday;
        solarEclipseIndicator.textContent=solarEclipseToday?(solarEclipseToday==='total'?'日全蝕樣本':'日偏蝕樣本'):'';
        if(solarEclipseToday)solarEclipseIndicator.dataset.eclipse=solarEclipseToday;else delete solarEclipseIndicator.dataset.eclipse;
        const dynamicEvents=activeDynamicEvents(date);
        const dynamicIndicator=document.querySelector('#dynamic-sky-indicator');
        const dynamicKinds=[...new Set(dynamicEvents.map(event=>event.dynamic))];
        dynamicIndicator.hidden=dynamicEvents.length===0;
        dynamicIndicator.textContent=dynamicEvents.map(event=>event.dynamicLabel).join(' · ');
        if(dynamicKinds.length)dynamicIndicator.dataset.dynamic=dynamicKinds.length>1?'mixed':dynamicKinds[0];else delete dynamicIndicator.dataset.dynamic;
        const transitReference=State.eventSamples.find(event=>event.kind==='transit'&&event.outOfRange);
        document.querySelector('#transit-reference-text').textContent=`2025–2026 沒有水星或金星凌日；下一次${transitReference.body}凌日為 ${transitReference.date}，超出目前日期軸。`;
        document.querySelector('#transit-reference-region').textContent=transitReference.region;

        const eventList=document.querySelector('#event-list');
        const nearby=State.eventSamples.map(event=>({...event,dateValue:new Date(`${event.date}T12:00:00Z`)})).filter(event=>Math.abs(event.dateValue-date)<=EVENT_WINDOW_DAYS*DAY_MS).sort((first,second)=>first.dateValue-second.dateValue);
        if(nearby.length===0){eventList.innerHTML=`<li class="event-list__empty">目前日期前後 ${EVENT_WINDOW_DAYS} 日沒有日期軸內事件樣本</li>`;}
        else eventList.innerHTML=nearby.map(event=>`<li class="event-list__item event-list__item--${event.kind}"><strong>${event.date} · ${event.type}</strong><span class="event-list__detail">${event.visible}</span><span class="event-list__region"><b>可觀測區域</b>${event.region}</span></li>`).join('');

        const localGlobal=Utils.globalTemperature(date);
        const localTemperatures=new Map(State.cities.map(city=>[city.id,Utils.temperature(city,date)]));
        const hasLocalMissing=!Number.isFinite(localGlobal)||State.cities.some(city=>!Number.isFinite(localTemperatures.get(city.id)));
        const remoteWeather=weatherCache.get(dateText);
        const usesRemoteGlobal=!Number.isFinite(localGlobal)&&Number.isFinite(remoteWeather?.average);
        const global=Number.isFinite(localGlobal)?localGlobal:(usesRemoteGlobal?remoteWeather.average:null);
        document.querySelector('#global-temperature-label').textContent=usesRemoteGlobal?`${remoteWeather.count} 城補值平均`:'全球基準訊號';
        document.querySelector('#global-temperature').textContent=Number.isFinite(global)?`${global.toFixed(2)} °C`:MISSING_DISPLAY;
        document.querySelector('#global-temperature').style.color=Utils.temperatureColor(global);
        document.querySelector('#weather-list').innerHTML=State.cities.map(city=>{
            const localTemperature=localTemperatures.get(city.id);
            const remoteTemperature=remoteWeather?.cities?.[city.id];
            const usesRemote=!Number.isFinite(localTemperature)&&Number.isFinite(remoteTemperature);
            const temperature=Number.isFinite(localTemperature)?localTemperature:(usesRemote?remoteTemperature:null);
            const meta=[Utils.hemisphere(city.lat,city.lon),Utils.season(date.getUTCMonth(),city.lat)];
            if(city.id==='taipei')meta.push(Utils.solarTerm(date));
            const referenceBadge=city.id==='taipei'?'<b class="reference-badge">觀測基準</b>':'';
            const remoteBadge=usesRemote?'<b class="remote-badge">遠端補值</b>':'';
            return `<article class="weather-row"><div class="weather-place"><div class="weather-place__title"><strong>${city.name}</strong>${referenceBadge}${remoteBadge}</div><span>${meta.join(' · ')}</span></div><div class="weather-value ${temperature===null?'weather-value--missing':''}" style="color:${Utils.temperatureColor(temperature)}"><i class="weather-dot" aria-hidden="true"></i><span>${temperature===null?MISSING_DISPLAY:`${temperature.toFixed(1)} °C`}</span></div></article>`;
        }).join('');
        const status=document.querySelector('#weather-data-status');
        const note=document.querySelector('#missing-data-note');
        if(!hasLocalMissing){status.textContent='SIMULATED DATA';note.hidden=true;}
        else if(remoteWeather){status.textContent=`${remoteWeather.complete?'OPEN-METEO':'PARTIAL'} · ${remoteWeather.mode==='forecast'?'FORECAST':'HISTORY'}`;note.hidden=false;note.textContent=`本地模型缺漏值已由 Open-Meteo ${remoteWeather.mode==='forecast'?'近期預報':'歷史資料'}補入 ${remoteWeather.count} 城；${remoteWeather.complete?'五城補值平均不代表全球均溫。':'未取得的城市仍保留缺漏。'}`;}
        else if(weatherPending.has(dateText)){status.textContent='FETCHING OPEN-METEO';note.hidden=false;note.textContent='偵測到缺漏值，正在向 Open-Meteo 查詢可用資料…';}
        else if(weatherRequestMode(date)===null){status.textContent='FUTURE · UNAVAILABLE';note.hidden=false;note.textContent='所選日期超出近期預報範圍，沒有可誠實補入的觀測或預報值，因此保留缺漏。';}
        else if(weatherFailed.has(dateText)){const attempts=weatherFailed.get(dateText).attempts;status.textContent='REMOTE DATA FAILED';note.hidden=false;note.textContent=attempts<2?'遠端資料目前無法取得；請檢查網路連線，系統將在 15 秒後自動重試一次。':'自動重試仍無法取得資料；請檢查網路連線後重新整理頁面。';}
        else {status.textContent='CHECKING MISSING DATA';note.hidden=false;note.textContent='偵測到缺漏值，準備檢查可用的歷史資料或近期預報…';scheduleMissingWeather(date);}
    }

    const FX = {
        starfield(count=1200,spread=180) {
            const geometry=new THREE.BufferGeometry();
            const positions=new Float32Array(count*3);
            for(let index=0;index<positions.length;index+=1)positions[index]=(Math.random()-.5)*spread;
            geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
            return new THREE.Points(geometry,new THREE.PointsMaterial({color:0xb9d9ef,size:.12,transparent:true,opacity:.7}));
        },
        glow(color,size) {
            const canvas=document.createElement('canvas'); canvas.width=64; canvas.height=64;
            const context=canvas.getContext('2d'); const gradient=context.createRadialGradient(32,32,1,32,32,32);
            gradient.addColorStop(0,color); gradient.addColorStop(.25,color.replace(/[^,]+\)$/,'0.55)')); gradient.addColorStop(1,'rgba(0,0,0,0)');
            context.fillStyle=gradient; context.fillRect(0,0,64,64);
            const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false})); sprite.scale.set(size,size,1); return sprite;
        },
        label(text,color='#ffffff') {
            const canvas=document.createElement('canvas'); canvas.width=256; canvas.height=64;
            const context=canvas.getContext('2d'); context.font='700 24px Microsoft JhengHei'; context.textAlign='center'; context.textBaseline='middle'; context.fillStyle='rgba(4,12,22,.78)'; context.fillRect(0,6,256,52); context.fillStyle=color; context.fillText(text,128,32);
            const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false})); sprite.scale.set(7,1.75,1); return sprite;
        }
    };

    function setupRenderer(host,camera) {
        const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
        renderer.outputEncoding=THREE.sRGBEncoding;
        host.appendChild(renderer.domElement);
        const loading=host.querySelector('.scene-loading');
        loading.hidden=true;
        loading.setAttribute('aria-hidden','true');
        const resize=()=>{const width=Math.max(1,host.clientWidth);const height=Math.max(1,host.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);};
        resize(); new ResizeObserver(resize).observe(host);
        return renderer;
    }

    function loadTexture(url,material) {
        new THREE.TextureLoader().load(url,texture=>{texture.encoding=THREE.sRGBEncoding;material.map=texture;material.needsUpdate=true;},undefined,()=>{});
    }

    function pointerPosition(event,element,target) {
        const rect=element.getBoundingClientRect();
        target.x=((event.clientX-rect.left)/rect.width)*2-1;
        target.y=-((event.clientY-rect.top)/rect.height)*2+1;
    }

    function initEarthSunScene() {
        const host=document.querySelector('#scene-earth-sun');
        const scene=new THREE.Scene();
        const camera=new THREE.PerspectiveCamera(45,1,.1,500); camera.position.set(0,27,37);
        const renderer=setupRenderer(host,camera);
        const controls=new THREE.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.enablePan=false; controls.minDistance=12; controls.maxDistance=75;
        controls.target.set(0,0,0); controls.saveState();
        document.querySelector('#reset-earth-view').addEventListener('click',()=>{controls.reset();controls.update();});
        scene.add(new THREE.AmbientLight(0x33485c,.8));
        const sunLight=new THREE.PointLight(0xffffff,2.4,100); scene.add(sunLight);
        scene.add(FX.starfield());

        const sunRadius=2.5;
        const sun=new THREE.Mesh(new THREE.SphereGeometry(sunRadius,32,32),new THREE.MeshBasicMaterial({color:0xffdc62})); sun.add(FX.glow('rgba(255,220,98,1)',11)); scene.add(sun);
        const eclipseGroup=new THREE.Group(); eclipseGroup.visible=false; scene.add(eclipseGroup);
        const eclipseDisk=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshBasicMaterial({color:0x010408,side:THREE.DoubleSide,depthTest:true,depthWrite:true})); eclipseDisk.renderOrder=12; eclipseGroup.add(eclipseDisk);
        const eclipseRimMaterial=new THREE.MeshBasicMaterial({color:0xffdc92,transparent:true,opacity:.78,side:THREE.DoubleSide,depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending});
        const eclipseRim=new THREE.Mesh(new THREE.RingGeometry(1.015,1.12,64),eclipseRimMaterial); eclipseRim.position.z=.004; eclipseRim.renderOrder=13; eclipseGroup.add(eclipseRim);
        const cameraWorld=new THREE.Vector3(); const cameraQuaternion=new THREE.Quaternion(); const sunWorld=new THREE.Vector3(); const towardCamera=new THREE.Vector3(); const cameraRight=new THREE.Vector3(); const cameraUp=new THREE.Vector3();
        let eclipseMode=null;
        const cometGroup=new THREE.Group(); cometGroup.visible=false; scene.add(cometGroup);
        const cometNucleus=new THREE.Mesh(new THREE.SphereGeometry(.28,18,18),new THREE.MeshBasicMaterial({color:0xe9fbff})); cometNucleus.add(FX.glow('rgba(126,230,255,0.86)',1.7)); cometGroup.add(cometNucleus);
        const cometTailMaterial=new THREE.MeshBasicMaterial({color:0x7ee6ff,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
        const cometTail=new THREE.Mesh(new THREE.ConeGeometry(.62,3.8,20,1,true),cometTailMaterial); cometTail.position.y=-1.9; cometGroup.add(cometTail);
        const cometUp=new THREE.Vector3(0,1,0); const cometToSun=new THREE.Vector3(); const cometWorld=new THREE.Vector3(); const earthWorld=new THREE.Vector3(); const cometRadial=new THREE.Vector3(); const cometTangent=new THREE.Vector3(); const cometBaseOffset=new THREE.Vector3(); const cometVertical=new THREE.Vector3(0,1,0); let cometAnimationPhase=0; let cometDayOffset=0; let activeCometKey='';
        const orbitRadius=17;
        const orbitPoints=new THREE.EllipseCurve(0,0,orbitRadius,orbitRadius,0,Math.PI*2).getPoints(180);
        const orbitLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints),new THREE.LineBasicMaterial({color:0x38536b})); orbitLine.rotation.x=Math.PI/2; scene.add(orbitLine);

        [[3,'近日點附近',0xff6b7a],[185,'遠日點附近',0x39d6f5]].forEach(([day,label,color])=>{
            const angle=day/365*Math.PI*2;
            const marker=new THREE.Mesh(new THREE.SphereGeometry(.28,12,12),new THREE.MeshBasicMaterial({color})); marker.position.set(Math.cos(angle)*orbitRadius,0,Math.sin(angle)*orbitRadius); scene.add(marker);
            const tag=FX.label(label,`#${color.toString(16).padStart(6,'0')}`); tag.position.set(Math.cos(angle)*(orbitRadius+2.8),.7,Math.sin(angle)*(orbitRadius+2.8)); scene.add(tag);
        });

        const seasonalPoints = [
            { day:78, label:'春分點 約 3/20', color:0xb9ec46, glow:'rgba(185,236,70,0.9)', labelRadius:20.2, labelHeight:1.3 },
            { day:171, label:'夏至點 約 6/21', color:0xffc75a, glow:'rgba(255,199,90,0.9)', labelRadius:20.2, labelHeight:1.3 },
            { day:264, label:'秋分點 約 9/22', color:0xf05bb5, glow:'rgba(240,91,181,0.9)', labelRadius:20.2, labelHeight:1.3 },
            { day:354, label:'冬至點 約 12/21', color:0x39d6f5, glow:'rgba(57,214,245,0.9)', labelRadius:21.4, labelHeight:2.1 }
        ];
        seasonalPoints.forEach(point=>{
            const angle=point.day/365*Math.PI*2;
            const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.38,0),new THREE.MeshBasicMaterial({color:point.color}));
            marker.position.set(Math.cos(angle)*orbitRadius,.08,Math.sin(angle)*orbitRadius);
            marker.add(FX.glow(point.glow,1.55));
            scene.add(marker);
            const tag=FX.label(point.label,`#${point.color.toString(16).padStart(6,'0')}`);
            tag.position.set(Math.cos(angle)*point.labelRadius,point.labelHeight,Math.sin(angle)*point.labelRadius);
            scene.add(tag);
        });

        const earthGroup=new THREE.Group(); scene.add(earthGroup);
        const tiltGroup=new THREE.Group(); tiltGroup.rotation.z=-23.4*Math.PI/180; earthGroup.add(tiltGroup);
        const spinGroup=new THREE.Group(); tiltGroup.add(spinGroup);
        const earthMaterial=new THREE.MeshStandardMaterial({color:0x3a77a8,roughness:.82});
        const earth=new THREE.Mesh(new THREE.SphereGeometry(1.45,32,32),earthMaterial); earth.add(FX.glow('rgba(57,140,245,0.65)',4.2)); spinGroup.add(earth); loadTexture(EARTH_TEXTURE,earthMaterial);
        const axis=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,4.2,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65})); tiltGroup.add(axis);
        State.cities.forEach(city=>{
            const phi=(90-city.lat)*Math.PI/180; const theta=(city.lon+180)*Math.PI/180; const radius=1.53;
            const marker=new THREE.Mesh(new THREE.SphereGeometry(city.id==='taipei'?.1:.065,8,8),new THREE.MeshBasicMaterial({color:city.id==='taipei'?0xb9ec46:0xffc75a})); marker.position.set(-radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.sin(theta)); spinGroup.add(marker);
        });
        const meteorGroup=new THREE.Group(); meteorGroup.visible=false; earthGroup.add(meteorGroup);
        const meteorDirection=new THREE.Vector3(-1,-.45,.12).normalize(); const meteorAcross=new THREE.Vector3().crossVectors(meteorDirection,new THREE.Vector3(0,1,0)).normalize(); const meteorUp=new THREE.Vector3().crossVectors(meteorAcross,meteorDirection).normalize(); const meteorStreaks=[]; let meteorRandomState=1; let activeMeteorKey='';
        const meteorRandom=()=>{meteorRandomState=(meteorRandomState*1664525+1013904223)>>>0;return meteorRandomState/4294967296;};
        const eventSeed=key=>Array.from(key).reduce((seed,character)=>((seed*31)+character.codePointAt(0))>>>0,2166136261);
        const resetMeteor=(streak,initial=false)=>{const travel=initial?meteorRandom()*6.4:0;streak.position.copy(meteorDirection).multiplyScalar(-3.2+travel).addScaledVector(meteorAcross,(meteorRandom()-.5)*5).addScaledVector(meteorUp,(meteorRandom()-.5)*4);streak.userData.travel=travel;streak.userData.speed=2.8+meteorRandom()*3.5;};
        for(let index=0;index<18;index+=1){const length=.55+meteorRandom()*.75;const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),meteorDirection.clone().multiplyScalar(-length)]);const colors=[0xfff2c6,0x9eeeff,0xffffff];const material=new THREE.LineBasicMaterial({color:colors[index%colors.length],transparent:true,opacity:.65+meteorRandom()*.32,depthWrite:false});const streak=new THREE.Line(geometry,material);resetMeteor(streak,true);meteorStreaks.push(streak);meteorGroup.add(streak);}

        const hitMesh=new THREE.Mesh(new THREE.TorusGeometry(orbitRadius,1.2,8,180),new THREE.MeshBasicMaterial({visible:false})); hitMesh.rotation.x=Math.PI/2; scene.add(hitMesh);
        const raycaster=new THREE.Raycaster(); const pointer=new THREE.Vector2(); const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0); const target=new THREE.Vector3();
        let mode=null; let previousX=0;
        renderer.domElement.addEventListener('pointerdown',event=>{pointerPosition(event,renderer.domElement,pointer);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(earth).length){mode='spin';previousX=event.clientX;}else if(raycaster.intersectObject(hitMesh).length)mode='orbit';if(mode){controls.enabled=false;renderer.domElement.setPointerCapture(event.pointerId);}});
        renderer.domElement.addEventListener('pointermove',event=>{if(mode==='spin'){State.earthRotationOffset+=(event.clientX-previousX)*.012;previousX=event.clientX;update();return;}if(mode!=='orbit')return;pointerPosition(event,renderer.domElement,pointer);raycaster.setFromCamera(pointer,camera);if(!raycaster.ray.intersectPlane(plane,target))return;let angle=Math.atan2(target.z,target.x);if(angle<0)angle+=Math.PI*2;const current=State.getDate();const year=current.getUTCFullYear();const yearStart=new Date(Date.UTC(year,0,1,12));const targetDate=new Date(yearStart.getTime()+Math.round(angle/(Math.PI*2)*(Utils.daysInYear(year)-1))*DAY_MS);State.setDays((targetDate-State.startDate)/DAY_MS);});
        const endDrag=event=>{if(mode&&renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);mode=null;controls.enabled=true;}; renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);

        function update(){
            const date=State.getDate();const dateText=Utils.formatDate(date);const angle=(Utils.dayOfYear(date)-1)/Utils.daysInYear(date.getUTCFullYear())*Math.PI*2;const dynamicEvents=activeDynamicEvents(date);const meteorEvent=dynamicEvents.find(event=>event.dynamic==='meteor');const cometEvent=dynamicEvents.find(event=>event.dynamic==='comet');
            eclipseMode=solarEclipseCoverage(date);earthGroup.position.set(Math.cos(angle)*orbitRadius,0,Math.sin(angle)*orbitRadius);eclipseGroup.visible=Boolean(eclipseMode);
            const meteorKey=meteorEvent?`${meteorEvent.date}|${dateText}`:'';meteorGroup.visible=Boolean(meteorEvent);if(meteorKey&&meteorKey!==activeMeteorKey){meteorRandomState=eventSeed(meteorKey);meteorStreaks.forEach(streak=>resetMeteor(streak,true));}activeMeteorKey=meteorKey;
            const cometKey=cometEvent?`${cometEvent.date}|${dateText}`:'';cometGroup.visible=Boolean(cometEvent);if(cometKey!==activeCometKey){cometAnimationPhase=0;activeCometKey=cometKey;}cometDayOffset=cometEvent?Math.round((date-new Date(`${cometEvent.date}T12:00:00Z`))/DAY_MS):0;
            spinGroup.rotation.y=State.currentDays*.14+State.earthRotationOffset;
        }
        function updateSolarEclipseBillboard(){
            if(!eclipseMode){eclipseGroup.visible=false;return;}
            camera.getWorldPosition(cameraWorld);camera.getWorldQuaternion(cameraQuaternion);sun.getWorldPosition(sunWorld);
            const distance=cameraWorld.distanceTo(sunWorld);const epsilon=.035;
            if(distance<=sunRadius+epsilon){eclipseGroup.visible=false;return;}
            const planeDistance=distance-sunRadius-epsilon;const projectedRadius=planeDistance*sunRadius/Math.sqrt(distance*distance-sunRadius*sunRadius)*1.02;
            towardCamera.copy(cameraWorld).sub(sunWorld).normalize();cameraRight.set(1,0,0).applyQuaternion(cameraQuaternion);cameraUp.set(0,1,0).applyQuaternion(cameraQuaternion);
            eclipseGroup.visible=true;eclipseGroup.quaternion.copy(cameraQuaternion);eclipseGroup.position.copy(sunWorld).addScaledVector(towardCamera,sunRadius+epsilon);
            if(eclipseMode==='partial')eclipseGroup.position.addScaledVector(cameraRight,projectedRadius*.82).addScaledVector(cameraUp,projectedRadius*.1);
            eclipseGroup.scale.setScalar(projectedRadius);eclipseRimMaterial.color.setHex(eclipseMode==='total'?0xf1f6ff:0xffdc92);eclipseRimMaterial.opacity=eclipseMode==='total'?.92:.74;
        }
        let previousFrameTime=performance.now();
        function updateEventAnimations(time){
            const delta=Math.min(Math.max((time-previousFrameTime)/1000,0),.05);previousFrameTime=time;
            if(meteorGroup.visible)meteorStreaks.forEach(streak=>{const distance=streak.userData.speed*delta;streak.position.addScaledVector(meteorDirection,distance);streak.userData.travel+=distance;if(streak.userData.travel>=6.4)resetMeteor(streak);});
            if(cometGroup.visible){const tangentOffset=cometDayOffset*.45;const radialOffset=3+Math.abs(cometDayOffset)*.07;cometAnimationPhase=(cometAnimationPhase+delta*.9)%(Math.PI*2);const wobble=Math.sin(cometAnimationPhase)*.035;earthGroup.getWorldPosition(earthWorld);cometRadial.copy(earthWorld).normalize();cometTangent.set(-cometRadial.z,0,cometRadial.x).normalize();cometBaseOffset.copy(cometRadial).multiplyScalar(radialOffset).addScaledVector(cometTangent,tangentOffset).applyAxisAngle(cometVertical,wobble);cometGroup.position.copy(earthWorld).add(cometBaseOffset);sun.getWorldPosition(sunWorld);cometGroup.getWorldPosition(cometWorld);cometToSun.copy(sunWorld).sub(cometWorld).normalize();cometGroup.quaternion.setFromUnitVectors(cometUp,cometToSun);cometTailMaterial.opacity=.2+(Math.sin(time*.004)+1)*.055;}
        }
        State.subscribe(update); update();
        const animate=(time=performance.now())=>{requestAnimationFrame(animate);if(!document.hidden){controls.update();updateSolarEclipseBillboard();updateEventAnimations(time);renderer.render(scene,camera);}}; animate();
    }

    function initMoonEarthScene() {
        const host=document.querySelector('#scene-moon-earth');
        const scene=new THREE.Scene();
        const camera=new THREE.PerspectiveCamera(45,1,.1,500); camera.position.set(0,18,25);
        const renderer=setupRenderer(host,camera);
        const controls=new THREE.OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.minDistance=8; controls.maxDistance=55;
        controls.target.set(0,0,0); controls.saveState();
        document.querySelector('#reset-moon-view').addEventListener('click',()=>{controls.reset();controls.update();});
        scene.add(new THREE.AmbientLight(0x26394b,.6)); const sunlight=new THREE.DirectionalLight(0xffffff,1.8); sunlight.position.set(100,0,0); scene.add(sunlight); scene.add(FX.starfield(900,130));
        const earthMaterial=new THREE.MeshStandardMaterial({color:0x3976a8,roughness:.82}); const earth=new THREE.Mesh(new THREE.SphereGeometry(2.5,32,32),earthMaterial); earth.add(FX.glow('rgba(57,140,245,0.6)',7)); scene.add(earth); loadTexture(EARTH_TEXTURE,earthMaterial);
        const orbitRadius=10.5; const orbitPoints=new THREE.EllipseCurve(0,0,orbitRadius,orbitRadius,0,Math.PI*2).getPoints(160); const orbitLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints),new THREE.LineBasicMaterial({color:0x48647d}));orbitLine.rotation.x=Math.PI/2;scene.add(orbitLine);
        const moonGroup=new THREE.Group();scene.add(moonGroup);const moonMaterial=new THREE.MeshStandardMaterial({color:0xb9b9b3,roughness:.9});const moon=new THREE.Mesh(new THREE.SphereGeometry(.72,28,28),moonMaterial);const moonNormalGlow=FX.glow('rgba(220,225,220,0.35)',2);const moonEclipseGlow=FX.glow('rgba(196,79,43,0.86)',2.8);moonEclipseGlow.visible=false;moon.add(moonNormalGlow,moonEclipseGlow);moonGroup.add(moon);loadTexture(MOON_TEXTURE,moonMaterial);
        const sunlightLabel=FX.label('太陽光 →','#ffc75a');sunlightLabel.position.set(12,5,0);scene.add(sunlightLabel);
        const hitMesh=new THREE.Mesh(new THREE.TorusGeometry(orbitRadius,1.15,8,160),new THREE.MeshBasicMaterial({visible:false}));hitMesh.rotation.x=Math.PI/2;scene.add(hitMesh);
        const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);const target=new THREE.Vector3();let dragging=false;
        renderer.domElement.addEventListener('pointerdown',event=>{pointerPosition(event,renderer.domElement,pointer);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(hitMesh).length){dragging=true;controls.enabled=false;renderer.domElement.setPointerCapture(event.pointerId);}});
        renderer.domElement.addEventListener('pointermove',event=>{if(!dragging)return;pointerPosition(event,renderer.domElement,pointer);raycaster.setFromCamera(pointer,camera);if(!raycaster.ray.intersectPlane(plane,target))return;let targetPhase=Math.atan2(target.z,target.x)/(Math.PI*2);if(targetPhase<0)targetPhase+=1;const current=Utils.moonPhase(State.getDate()).phase;let difference=targetPhase-current;if(difference>.5)difference-=1;if(difference<-.5)difference+=1;State.setDays(State.currentDays+difference*SYNODIC_MONTH);});
        const endDrag=event=>{if(dragging&&renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);dragging=false;controls.enabled=true;};renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
        function update(){const date=State.getDate();const phase=Utils.moonPhase(date).phase;const angle=phase*Math.PI*2;const lunarEclipse=isLunarEclipseDate(date);moonGroup.position.set(Math.cos(angle)*orbitRadius,0,Math.sin(angle)*orbitRadius);moonMaterial.color.setHex(lunarEclipse?0xbf5632:0xb9b9b3);moonMaterial.emissive.setHex(lunarEclipse?0x4a160e:0x000000);moonMaterial.emissiveIntensity=lunarEclipse?.62:1;moonNormalGlow.visible=!lunarEclipse;moonEclipseGlow.visible=lunarEclipse;earth.rotation.y=State.currentDays*.1+State.earthRotationOffset;}
        State.subscribe(update);update();const animate=()=>{requestAnimationFrame(animate);if(!document.hidden){controls.update();renderer.render(scene,camera);}};animate();
    }

    function markSceneError(message) { document.querySelectorAll('.scene-host').forEach(host=>{const loading=host.querySelector('.scene-loading');host.classList.add('has-error');loading.hidden=false;loading.removeAttribute('aria-hidden');loading.textContent=message;}); }

    function setupControls() {
        const setFromDials=()=>{const year=Number(document.querySelector('#dial-year').value);const month=Number(document.querySelector('#dial-month').value);const requested=Number(document.querySelector('#dial-day').value);const day=Math.min(requested,Utils.daysInMonth(year,month-1));const target=new Date(Date.UTC(year,month-1,day,12));State.setDays((target-State.startDate)/DAY_MS);};
        document.querySelector('#time-slider').addEventListener('input',event=>State.setDays(event.target.value));
        document.querySelectorAll('#dial-year,#dial-month,#dial-day').forEach(control=>control.addEventListener('change',setFromDials));
        document.querySelectorAll('[data-day-step]').forEach(button=>button.addEventListener('click',()=>State.setDays(State.currentDays+Number(button.dataset.dayStep))));
        document.querySelector('#btn-reset-date').addEventListener('click',()=>State.setDays(0));
    }

    function setupModals() {
        let lastFocus=null;
        const open=id=>{lastFocus=document.activeElement;const modal=document.querySelector(`#${id}`);modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');modal.querySelector('.modal__close').focus();};
        const close=modal=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');if(lastFocus)lastFocus.focus();};
        document.querySelector('#btn-guide').addEventListener('click',()=>open('modal-guide'));
        document.querySelector('#btn-principle').addEventListener('click',()=>open('modal-principle'));
        document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>close(button.closest('.modal'))));
        document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',event=>{if(event.target===modal)close(modal);}));
        document.addEventListener('keydown',event=>{if(event.key==='Escape'){const modal=document.querySelector('.modal.is-open');if(modal)close(modal);}});
    }

    populateDateControls();
    syncDayOptions(2025,1,1);
    setupControls();
    setupModals();
    State.subscribe(updateUI);
    updateUI();
    if(!window.THREE||!THREE.OrbitControls)markSceneError('3D 函式庫載入失敗；請確認網路連線後重新整理。');
    else { try { initEarthSunScene(); initMoonEarthScene(); } catch(error) { console.error(error); markSceneError('3D 場景初始化失敗；資料面板仍可使用。'); } }
})();
