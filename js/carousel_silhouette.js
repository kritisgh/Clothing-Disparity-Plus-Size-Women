// js/carousel_silhouette.js
(function(){
    const JSON_PATH_SIL = 'same_silhouette.json';
    const container_sil = document.getElementById('carousel_silhouette');
    let   items_sil       = [];
    let   strips_sil      = [];

    function lerp(a,b,t){ return a + (b-a)*t; }

    fetch(JSON_PATH_SIL)
    .then(r=>r.json())
    .then(js=> { items_sil = js;  buildCarousel(); })
    .catch(e=>console.error(e));

    function buildCarousel(){
        container_sil.innerHTML = '';
        strips_sil = [];

        let data = items_sil;

        const style   = getComputedStyle(container_sil),
              padL    = parseFloat(style.paddingLeft),
              padR    = parseFloat(style.paddingRight),
              totW    = container_sil.clientWidth - padL - padR,
              sliceW  = totW / data.length,
              rect    = container_sil.getBoundingClientRect(),
              centers = data.map((_,i)=> rect.left+padL+sliceW*(i+0.5));

        document.documentElement.style.setProperty('--slice-width', `${sliceW}px`);

        data.forEach((it,i)=>{
          const strip = document.createElement('div');
          strip.className       = 'strip';
          strip.dataset.centerX = centers[i];
          strip.dataset.index   = i;
          strip.style.width     = sliceW+'px';

          const img = document.createElement('img');
          img.className       = 'full';
          img.src             = it.imageUrl;
          img.alt             = '';
          img.style.visibility = 'hidden';
          strip.appendChild(img);

          img.addEventListener('load', ()=>{
            const h     = strip.clientHeight,
                  rawW  = img.naturalWidth*(h/img.naturalHeight);
            strip.dataset.fullWidth = Math.min(rawW, totW);
            img.style.visibility    = '';
          });

          container_sil.appendChild(strip);
          strips_sil.push(strip);
        });

        container_sil.onmousemove = e=>{
            const x = e.clientX;
            strips_sil.forEach(s=>{
              const cx    = +s.dataset.centerX,
                    d     = Math.abs(x-cx),
                    maxW  = +s.dataset.fullWidth||sliceW,
                    ratio = Math.max(0,(maxW-d)/maxW);
              s._targetW  = sliceW + ratio*(maxW-sliceW);
            });
          };

        container_sil.onmouseleave = ()=>{
            strips_sil.forEach(s=>{
              s._targetW = s._currentW = sliceW;
              s.style.transition = 'none';
              s.style.width     = sliceW+'px';
              requestAnimationFrame(()=> s.style.transition = '');
            });
        };

        (function animate(){
            strips_sil.forEach(s=>{
              if (s._currentW==null) s._currentW=sliceW;
              if (s._targetW ==null) s._targetW =sliceW;
              s._currentW = lerp(s._currentW,s._targetW,0.1);
              s.style.width = s._currentW+'px';
            });
            requestAnimationFrame(animate);
        })();
    }
})();