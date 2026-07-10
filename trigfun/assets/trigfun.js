(() => {
    'use strict';

    const TAU = Math.PI * 2;
    const RADIUS = 125;
    const MAX_ANGLE = 10 * TAU;
    const EPSILON = 1e-10;
    let totalAngle = Math.PI / 4;
    let previousRawAngle = Math.PI / 4;
    let dragging = false;
    let angleMode = 'degree';

    const svg = document.querySelector('#unit-circle');
    const point = document.querySelector('#drag-point');
    const radiusLine = document.querySelector('#radius-line');
    const radiusLabel = document.querySelector('#radius-label');
    const pointLabel = document.querySelector('#point-label');
    const projectionX = document.querySelector('#projection-x');
    const projectionY = document.querySelector('#projection-y');
    const angleArc = document.querySelector('#angle-arc');
    const waveFunctions = [
        { key:'sin', label:'sin θ', fn:Math.sin, max:1.4, color:'#ff7180' },
        { key:'cos', label:'cos θ', fn:Math.cos, max:1.4, color:'#39d6f5' },
        { key:'tan', label:'tan θ', fn:Math.tan, max:4, color:'#ffc75a' },
        { key:'csc', label:'csc θ', fn:x => 1 / Math.sin(x), max:4, color:'#48dfbd' },
        { key:'sec', label:'sec θ', fn:x => 1 / Math.cos(x), max:4, color:'#a78bfa' },
        { key:'cot', label:'cot θ', fn:x => 1 / Math.tan(x), max:4, color:'#ff9365' }
    ];
    const waveViews = new Map();

    function normalized(angle) { return ((angle % TAU) + TAU) % TAU; }
    function near(a,b,tolerance=1e-8) { return Math.abs(a-b) < tolerance; }
    function greatestCommonDivisor(a,b) {
        a=Math.abs(a); b=Math.abs(b);
        while(b){ const remainder=a%b; a=b; b=remainder; }
        return a||1;
    }
    function formatRadian(angle) {
        if (near(angle,0,1e-9)) return '0π rad';
        const degrees=angle*180/Math.PI;
        const roundedDegrees=Math.round(degrees);
        if(near(degrees,roundedDegrees,1e-7)){
            const divisor=greatestCommonDivisor(roundedDegrees,180);
            const numerator=roundedDegrees/divisor;
            const denominator=180/divisor;
            const sign=numerator<0?'-':'';
            const absolute=Math.abs(numerator);
            if(denominator===1)return `${sign}${absolute===1?'':absolute}π rad`;
            return `${sign}${absolute===1?'':absolute}π/${denominator} rad`;
        }
        return `${angle.toFixed(2)} rad`;
    }
    function formatAngle(angle) {
        return angleMode==='degree' ? `${(angle*180/Math.PI).toFixed(2)}°` : formatRadian(angle);
    }
    function formatQuickAngle(degrees) {
        if(angleMode==='degree')return degrees===0?'0':`${degrees>0?'+':''}${degrees}度`;
        const radianText=formatRadian(degrees*Math.PI/180).replace(' rad','');
        return degrees>0?`+${radianText}`:radianText;
    }
    function formatStaticAngle(degrees) {
        return angleMode==='degree'?`${degrees}°`:formatRadian(degrees*Math.PI/180).replace(' rad','');
    }
    function formatValue(value, angle) {
        if (!Number.isFinite(value) || Math.abs(value) > 10000) return '未定義';
        const snapped = Math.round(normalized(angle) / (Math.PI / 12)) * (Math.PI / 12);
        if (near(normalized(angle), normalized(snapped), 1e-7)) {
            const exact = [
                [0,'0'],[.5,'1/2'],[-.5,'-1/2'],[1,'1'],[-1,'-1'],
                [Math.SQRT1_2,'√2/2'],[-Math.SQRT1_2,'-√2/2'],
                [Math.sqrt(3)/2,'√3/2'],[-Math.sqrt(3)/2,'-√3/2'],
                [Math.sqrt(3),'√3'],[-Math.sqrt(3),'-√3'],
                [Math.sqrt(3)/3,'√3/3'],[-Math.sqrt(3)/3,'-√3/3'],
                [Math.SQRT2,'√2'],[-Math.SQRT2,'-√2']
            ].find(([number]) => near(value,number,1e-8));
            if (exact) return exact[1];
        }
        const fixed = value.toFixed(2);
        return fixed === '-0.00' ? '0.00' : fixed;
    }

    function valuesAt(angle) {
        const rad = normalized(angle);
        const a = Math.cos(rad), b = Math.sin(rad);
        return { rad, a, b, sin:b, cos:a, tan:Math.abs(a)<EPSILON?NaN:b/a, cot:Math.abs(b)<EPSILON?NaN:a/b, sec:Math.abs(a)<EPSILON?NaN:1/a, csc:Math.abs(b)<EPSILON?NaN:1/b };
    }

    function makeGrid() {
        const grid = document.querySelector('#circle-grid');
        for (let pos=-150; pos<=150; pos+=25) {
            const horizontal = document.createElementNS('http://www.w3.org/2000/svg','line');
            horizontal.setAttribute('x1','-150'); horizontal.setAttribute('x2','150'); horizontal.setAttribute('y1',pos); horizontal.setAttribute('y2',pos); horizontal.setAttribute('class','grid-line');
            const vertical = horizontal.cloneNode(); vertical.setAttribute('x1',pos); vertical.setAttribute('x2',pos); vertical.setAttribute('y1','-150'); vertical.setAttribute('y2','150');
            grid.append(horizontal,vertical);
        }
    }

    function arcPath(rad) {
        if (near(rad,0)) return '';
        const r=34, x=r*Math.cos(rad), y=-r*Math.sin(rad), large=rad>Math.PI?1:0;
        return `M ${r} 0 A ${r} ${r} 0 ${large} 0 ${x} ${y}`;
    }

    function createWaveforms() {
        const grid = document.querySelector('#wave-grid');
        waveFunctions.forEach(config => {
            const card=document.createElement('article'); card.className='wave-card';
            card.style.setProperty('--wave-color',config.color);
            card.innerHTML=`<div class="wave-title"><span style="color:${config.color}">${config.label}</span><output>0</output></div><svg class="wave-svg" viewBox="-8 -5 236 100" aria-label="${config.label} 週期波形"><line class="wave-axis" x1="0" y1="45" x2="220" y2="45"></line><line class="wave-guide" x1="110" y1="0" x2="110" y2="90"></line><line class="wave-guide current-line" x1="0" y1="0" x2="0" y2="90"></line><path class="wave-path" stroke="${config.color}"></path><circle class="wave-marker" r="4" stroke="${config.color}"></circle><text class="wave-label wave-label--start" x="0" y="58">0°</text><text class="wave-label wave-label--middle" x="104" y="58">180°</text><text class="wave-label wave-label--end" x="204" y="58">360°</text></svg>`;
            grid.append(card);
            const path=card.querySelector('.wave-path'); let d='', drawing=false, previousY=0;
            for(let x=0;x<=220;x+=1){ const rad=x/220*TAU, val=config.fn(rad); const y=45-val/config.max*42; const valid=Number.isFinite(val)&&Math.abs(val)<=config.max*2.5; if(!valid||drawing&&Math.abs(y-previousY)>60){drawing=false;continue;} d+=`${drawing?'L':'M'} ${x.toFixed(1)} ${y.toFixed(1)} `; drawing=true; previousY=y; }
            path.setAttribute('d',d);
            waveViews.set(config.key,{...config,output:card.querySelector('output'),marker:card.querySelector('.wave-marker'),line:card.querySelector('.current-line'),labels:card.querySelectorAll('.wave-label')});
        });
    }

    function render() {
        const value=valuesAt(totalAngle), x=value.a*RADIUS, y=-value.b*RADIUS;
        point.setAttribute('cx',x); point.setAttribute('cy',y); point.setAttribute('aria-valuenow',(totalAngle*180/Math.PI).toFixed(2)); point.setAttribute('aria-valuetext',formatAngle(totalAngle));
        radiusLine.setAttribute('x2',x); radiusLine.setAttribute('y2',y);
        projectionX.setAttribute('x1',x); projectionX.setAttribute('y1',y); projectionX.setAttribute('x2',x); projectionX.setAttribute('y2','0');
        projectionY.setAttribute('x1',x); projectionY.setAttribute('y1',y); projectionY.setAttribute('x2','0'); projectionY.setAttribute('y2',y);
        radiusLabel.setAttribute('x',x/2+(value.a<0?-28:5)); radiusLabel.setAttribute('y',y/2-7);
        pointLabel.setAttribute('x',x+(value.a<0?-62:10)); pointLabel.setAttribute('y',y+(value.b>0?-10:18));
        angleArc.setAttribute('d',arcPath(value.rad));
        const turnCoefficient=Math.round((totalAngle-value.rad)/TAU);
        const normalizedText=formatAngle(value.rad);
        document.querySelector('#total-angle').textContent=formatAngle(totalAngle);
        document.querySelector('#radius-value').textContent='1.00';
        document.querySelector('#coterminal-definition').textContent=`θ = ${angleMode==='degree'?'360°':'2π rad'} × (${turnCoefficient}) + ${normalizedText}`;
        document.querySelector('#coord-a').textContent=formatValue(value.a,totalAngle);
        document.querySelector('#coord-b').textContent=formatValue(value.b,totalAngle);
        ['sin','cos','tan','cot','sec','csc'].forEach(key => document.querySelector(`[data-function="${key}"] strong`).textContent=formatValue(value[key],totalAngle));
        document.querySelector('#wave-range').textContent=angleMode==='degree'?'0° → 360°':'0π → 2π rad';
        document.querySelector('#btn-angle-unit').textContent=angleMode==='degree'?'切換為徑度量':'切換為度度量';
        document.querySelector('#btn-angle-unit').setAttribute('aria-pressed',angleMode==='radian'?'true':'false');
        document.querySelector('#btn-reset').textContent=angleMode==='degree'?'重設 45°':'重設 π/4 rad';
        document.querySelector('#keyboard-step').textContent=angleMode==='degree'?'1°':'π/180 rad';
        document.querySelector('#keyboard-step-large').textContent=angleMode==='degree'?'10°':'π/18 rad';
        document.querySelectorAll('[data-special-angle]').forEach(label=>{label.textContent=formatStaticAngle(Number(label.dataset.specialAngle));});
        document.querySelectorAll('[data-quick-angle]').forEach(button=>{button.textContent=formatQuickAngle(Number(button.dataset.quickAngle));});
        waveViews.forEach((view,key)=>{ const xPos=value.rad/TAU*220, current=value[key], yPos=45-current/view.max*42, visible=Number.isFinite(current)&&Math.abs(current)<=view.max*1.1; const labels=angleMode==='degree'?['0°','180°','360°']:['0π','π','2π']; view.labels.forEach((label,index)=>{label.textContent=labels[index];}); view.output.textContent=formatValue(current,totalAngle); view.line.setAttribute('x1',xPos); view.line.setAttribute('x2',xPos); view.marker.setAttribute('cx',xPos); view.marker.setAttribute('cy',Math.max(1,Math.min(89,yPos))); view.marker.style.display=visible?'':'none'; });
    }

    function pointerAngle(event) {
        const matrix=svg.getScreenCTM(); if(!matrix) return 0;
        const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
        let raw=Math.atan2(-p.y,p.x); if(raw<0) raw+=TAU; return raw;
    }
    function startDrag(event){ dragging=true; previousRawAngle=pointerAngle(event); point.setPointerCapture(event.pointerId); document.querySelector('#drag-status').textContent='TRACKING ANGLE'; }
    function moveDrag(event){ if(!dragging)return; const raw=pointerAngle(event); let delta=raw-previousRawAngle; if(delta>Math.PI)delta-=TAU; if(delta<-Math.PI)delta+=TAU; totalAngle=Math.max(-MAX_ANGLE,Math.min(MAX_ANGLE,totalAngle+delta)); previousRawAngle=raw; render(); }
    function stopDrag(event){ dragging=false; if(point.hasPointerCapture(event.pointerId))point.releasePointerCapture(event.pointerId); document.querySelector('#drag-status').textContent='DRAG POINT P'; }

    function setupModals(){ let lastFocus=null; document.querySelector('#btn-guide').addEventListener('click',()=>open('modal-guide')); document.querySelector('#btn-formula').addEventListener('click',()=>open('modal-formula')); document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>close(button.closest('.modal')))); document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',event=>{if(event.target===modal)close(modal);})); document.addEventListener('keydown',event=>{if(event.key==='Escape'){const modal=document.querySelector('.modal.is-open');if(modal)close(modal);}}); function open(id){lastFocus=document.activeElement;const modal=document.querySelector(`#${id}`);modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');modal.querySelector('.modal__close').focus();} function close(modal){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');if(lastFocus)lastFocus.focus();} }

    point.addEventListener('pointerdown',startDrag); point.addEventListener('pointermove',moveDrag); point.addEventListener('pointerup',stopDrag); point.addEventListener('pointercancel',stopDrag);
    point.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const step=(event.shiftKey?10:1)*Math.PI/180;totalAngle=Math.max(-MAX_ANGLE,Math.min(MAX_ANGLE,totalAngle+(event.key==='ArrowRight'?step:-step)));render();});
    document.querySelectorAll('[data-quick-angle]').forEach(button=>button.addEventListener('click',()=>{const increment=Number(button.dataset.quickAngle)*Math.PI/180;totalAngle=Math.max(-MAX_ANGLE,Math.min(MAX_ANGLE,totalAngle+increment));previousRawAngle=normalized(totalAngle);render();}));
    document.querySelector('#btn-angle-unit').addEventListener('click',()=>{angleMode=angleMode==='degree'?'radian':'degree';render();});
    document.querySelector('#btn-reset').addEventListener('click',()=>{totalAngle=Math.PI/4;previousRawAngle=Math.PI/4;render();point.focus();});
    makeGrid(); createWaveforms(); setupModals(); render();
})();
