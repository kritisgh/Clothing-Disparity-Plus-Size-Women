// js/carousel_csv.js

;(function(){
  const JSON_PATH       = 'plusimg.json';
  const JSONL_PATH      = 'plus_product_datacolor_mango.jsonl';
  const container       = document.getElementById('carousel');
  const togglePlusBtn   = document.getElementById('toggle-plus');
  let   baseItems       = [],
        extraItems      = [],
        strips          = [],
        showProducts    = false;
  let bracketWrapper, bracket, text;
  const BRACKET_SLICES = 9;

  // 9 hard-coded “first 9” product URLs:
  const staticFirst9 = [
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87039065_05_B.jpg?imwidth=320&imdensity=1&ts=1741955812248',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87068270_30_B.jpg?imwidth=2048&imdensity=1&ts=1740670963056',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87084092_30_B.jpg?imwidth=320&imdensity=1&ts=1734955503851',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87097184_99_B.jpg?imwidth=480&imdensity=1&ts=1737621300434',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87030621_30_B.jpg?imwidth=480&imdensity=1&ts=1727366644824',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87010622_99_B.jpg?imwidth=480&imdensity=1&ts=1728572721091',
    'https://shop.mango.com/assets/rcs/pics/static/T8/fotos/S/87040284_94_B.jpg?imwidth=320&imdensity=1&ts=1727446599384',
    'https://shop.mango.com/assets/rcs/pics/static/T7/fotos/S/77029060_99_B.jpg?imwidth=320&imdensity=1&ts=1726763673697',
    'https://shop.mango.com/assets/rcs/pics/static/T7/fotos/S/77060344_14_B.jpg?imwidth=320&imdensity=1&ts=1713891879501'
  ];

  function lerp(a,b,t){ return a + (b-a)*t; }

  togglePlusBtn.textContent = 'View Products';

  // load model-shots JSON
  fetch(JSON_PATH)
    .then(r=>r.json())
    .then(js=> { baseItems = js.filter(o=>o.imageUrl); tryBuild(); })
    .catch(e=>console.error(e));

  // load plus-products JSONL
  fetch(JSONL_PATH)
    .then(r=>r.text())
    .then(txt=>{
      extraItems = txt.trim().split('\n')
        .map(l=>{ try{ return JSON.parse(l);}catch{return null;} })
        .filter(o=>o && o.second_last_url);
      tryBuild();
    })
    .catch(e=>console.error(e));

  togglePlusBtn.addEventListener('click', ()=>{
    showProducts = !showProducts;
    togglePlusBtn.textContent = showProducts ? 'View Models' : 'View Products';
    render();
  });

  function tryBuild(){
    if (!baseItems.length || !extraItems.length) return;
    render();
  }

  function render(){
    container.innerHTML = '';
    strips = [];

    // Remove any existing annotation container
    const existingAnnotationContainer = document.querySelector('.annotation-container');
    if (existingAnnotationContainer) {
      existingAnnotationContainer.remove();
    }

    // construct display list:
    let data = showProducts
      // first 9 from staticFirst9, then extraItems[9..]
      ? staticFirst9.map(u=>({url:u,alt:''}))
          .concat(
            extraItems.slice(9).map(o=>({url:o.second_last_url,alt:o.product_url||''}))
          )
      // model shots:
      : baseItems.map(o=>({url:o.imageUrl,alt:o.title||''}));

    const style   = getComputedStyle(container),
          padL    = parseFloat(style.paddingLeft),
          padR    = parseFloat(style.paddingRight),
          totW    = container.clientWidth - padL - padR,
          sliceW  = totW / data.length,
          rect    = container.getBoundingClientRect(),
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
      img.src             = it.url;
      img.alt             = it.alt;
      img.style.visibility = 'hidden';
      strip.appendChild(img);

      img.addEventListener('load', ()=>{
        const h     = strip.clientHeight,
              rawW  = img.naturalWidth*(h/img.naturalHeight);
        strip.dataset.fullWidth = Math.min(rawW, totW);
        img.style.visibility    = '';
      });

      container.appendChild(strip);
      strips.push(strip);
    });

    // 4) Create an outer container for both bracket and text
    const annotationContainer = document.createElement('div');
    annotationContainer.className = 'annotation-container';
    annotationContainer.style.position = 'absolute';
    // corrected left position.
    annotationContainer.style.left = `${strips[0].getBoundingClientRect().left}px`;
    annotationContainer.style.top = `${container.getBoundingClientRect().bottom + 5}px`;
    annotationContainer.style.display = 'flex';
    annotationContainer.style.flexDirection = 'column';
    annotationContainer.style.alignItems = 'flex-start';
    annotationContainer.style.marginBottom = '20px';
    document.body.appendChild(annotationContainer);

    // 5a) Add the bracket wrapper that will expand - positioned to align with first strip
    bracketWrapper = document.createElement('div');
    bracketWrapper.style.width = `${sliceW * BRACKET_SLICES}px`;
    bracketWrapper.style.boxSizing = 'border-box';
    bracketWrapper.style.marginLeft = `0px`;
    bracketWrapper._currentWidth = sliceW * BRACKET_SLICES;
    bracketWrapper._targetWidth = sliceW * BRACKET_SLICES;
    annotationContainer.appendChild(bracketWrapper);

    // 5b) Add the bracket (always full-width of wrapper)
    bracket = document.createElement('div');
    bracket.style.height    = '12px';
    bracket.style.borderLeft  = '1px solid black';
    bracket.style.borderBottom = '1px solid black';
    bracket.style.borderRight = '1px solid black';
    bracket.style.boxSizing   = 'border-box';
    bracket.style.width     = '100%';
    bracketWrapper.appendChild(bracket);

    // 5c) Add the caption to the left, fixed position relative to annotation container
    text = document.createElement('div');
    text.textContent = 'the only 9 short dresses available';
    text.style.fontFamily = 'Arial, sans-serif';
    text.style.fontSize = '12px';
    text.style.lineHeight = '12px';
    text.style.color = '#333';
    text.style.position = 'absolute';
    text.style.left = `0px`;
    text.style.top = `${bracket.offsetHeight + 2}px`;
    text.style.whiteSpace = 'nowrap';
    annotationContainer.appendChild(text);

    container.onmousemove = e=>{
      const x = e.clientX;
      strips.forEach(s=>{
        const cx    = +s.dataset.centerX,
              d     = Math.abs(x-cx),
              maxW  = +s.dataset.fullWidth||sliceW,
              ratio = Math.max(0,(maxW-d)/maxW);
        s._targetW  = sliceW + ratio*(maxW-sliceW);
      });

      // Update bracket width on mousemove
      if (strips.length >= BRACKET_SLICES) {
        let totalWidth = 0;
        for (let i = 0; i < BRACKET_SLICES; i++) {
          totalWidth += strips[i]._targetW || sliceW;
        }
        bracketWrapper._targetWidth = totalWidth;
        text.style.width = `${totalWidth}px`;
      }
    };
    container.onmouseleave = ()=>{
      strips.forEach(s=>{
        s._targetW = s._currentW = sliceW;
        s.style.transition = 'none';
        s.style.width     = sliceW+'px';
        requestAnimationFrame(()=> s.style.transition = '');
      });
      bracketWrapper._targetWidth = sliceW * BRACKET_SLICES;
      text.style.width = `${sliceW * BRACKET_SLICES}px`;
    };
    (function animate(){
      strips.forEach(s=>{
        if (s._currentW==null) s._currentW=sliceW;
        if (s._targetW ==null) s._targetW =sliceW;
        s._currentW = lerp(s._currentW,s._targetW,0.1);
        s.style.width = s._currentW+'px';
      });
      // Animate bracket
      bracketWrapper._currentWidth = lerp(bracketWrapper._currentWidth, bracketWrapper._targetWidth, 0.08);
      bracketWrapper.style.width = `${bracketWrapper._currentWidth}px`;

      requestAnimationFrame(animate);
    })();
  }
})();