(function(){
  const JSONL_PATH = 'regular_product_data_mango.jsonl';
  const container = document.getElementById('carousel_json');
  const strips = [];

  function lerp(a,b,t){ return a + (b-a)*t; }

  fetch(JSONL_PATH)
    .then(r => r.text())
    .then(txt => {
      const items = txt.trim().split('\n')
        .map(l => { try { return JSON.parse(l) } catch { return null } })
        .filter(o => o && o.second_image_url);

      // 1) compute slice width
      const style = getComputedStyle(container);
      const padL = parseFloat(style.paddingLeft),
            padR = parseFloat(style.paddingRight);
      const totalW = container.clientWidth - padL - padR;
      const sliceW = totalW / items.length;

      // 2) centers
      const rect = container.getBoundingClientRect();
      const centers = items.map((_,i)=> rect.left + padL + sliceW*(i+0.5) );

      // 3) build strips
      items.forEach((item,i)=>{
        const url = item.second_image_url;
        if (!url) return;

        const strip = document.createElement('div');
        strip.className = 'strip';
        strip.dataset.centerX = centers[i];
        strip.style.width = sliceW + 'px';
        container.appendChild(strip);
        strips.push(strip);

        const img = document.createElement('img');
        img.className = 'full';
        img.src = url;
        img.alt = item.product_url || '';
        img.style.visibility = 'hidden';
        strip.appendChild(img);

        img.addEventListener('load', ()=>{
          const rawW = img.naturalWidth * (strip.clientHeight/img.naturalHeight);
          strip.dataset.fullWidth = Math.min(rawW, totalW);
          img.style.visibility = '';
        });
      });

      // 4) on mousemove
      container.addEventListener('mousemove', e => {
        const x = e.clientX;
        strips.forEach(s => {
          const cx = +s.dataset.centerX;
          const d  = Math.abs(x - cx);
          const maxW = +s.dataset.fullWidth || sliceW;
          const ratio = Math.max(0, (maxW - d)/maxW);
          s._targetW = sliceW + ratio * (maxW - sliceW);
        });
      });

      // 5) on mouseleave
      container.addEventListener('mouseleave', ()=>{
        strips.forEach(s=>{
          s._targetW = s._currentW = sliceW;
          s.style.transition = 'none';
          s.style.width = sliceW+'px';
          requestAnimationFrame(()=> s.style.transition = '');
        });
      });

      // 6) animate
      (function animate(){
        strips.forEach(s => {
          if (s._currentW == null) s._currentW = sliceW;
          if (s._targetW  == null) s._targetW  = sliceW;
          s._currentW = lerp(s._currentW, s._targetW, 0.1);
          s.style.width = s._currentW + 'px';
        });
        requestAnimationFrame(animate);
      })();
    })
    .catch(err => console.error('JSONL carousel error:', err));
})();
