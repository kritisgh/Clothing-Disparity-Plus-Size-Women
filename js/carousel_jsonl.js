;(function(){
  const JSONL_PATH    = 'regular_product_data_mango.jsonl';
  const container     = document.getElementById('carousel_json');
  const toggleBtn     = document.getElementById('toggle-img-mode');
  let   items         = [];
  let   strips        = [];
  let   useSecondLast = false;

  function lerp(a, b, t){ return a + (b - a) * t; }

  // load and parse the JSONL
  fetch(JSONL_PATH)
    .then(r => r.text())
    .then(txt => {
      items = txt
        .trim()
        .split('\n')
        .map(l => {
          try { return JSON.parse(l); }
          catch { return null; }
        })
        .filter(o => o && (o.second_image_url || o.second_last_url));
      buildCarousel();
    })
    .catch(err => console.error('JSONL fetch error:', err));

  // toggle handler
  toggleBtn.addEventListener('click', () => {
    useSecondLast = !useSecondLast;
    // update button text
    toggleBtn.textContent = useSecondLast
      ? 'View Models'
      : 'View Products';
    buildCarousel();
  });

  function buildCarousel(){
    container.innerHTML = '';
    strips = [];

    if (!items.length) return;

    const style   = getComputedStyle(container);
    const padL    = parseFloat(style.paddingLeft);
    const padR    = parseFloat(style.paddingRight);
    const totalW  = container.clientWidth - padL - padR;
    const sliceW  = totalW / items.length;
    const rect    = container.getBoundingClientRect();
    const centers = items.map((_, i) =>
      rect.left + padL + sliceW * (i + 0.5)
    );

    items.forEach((it, i) => {
      const url = useSecondLast
        ? it.second_last_url
        : it.second_image_url;
      if (!url) return;

      const strip = document.createElement('div');
      strip.className       = 'strip';
      strip.dataset.centerX = centers[i];
      strip.style.width     = sliceW + 'px';

      const img = document.createElement('img');
      img.className        = 'full';
      img.src              = url;
      img.alt              = it.product_url || '';
      img.style.visibility = 'hidden';
      strip.appendChild(img);

      img.addEventListener('load', () => {
        const dispH = strip.clientHeight;
        const rawW  = img.naturalWidth * (dispH / img.naturalHeight);
        strip.dataset.fullWidth = Math.min(rawW, totalW);
        img.style.visibility    = '';
      });

      container.appendChild(strip);
      strips.push(strip);
    });

    container.onmousemove = e => {
      const x = e.clientX;
      strips.forEach(s => {
        const cx    = +s.dataset.centerX;
        const d     = Math.abs(x - cx);
        const maxW  = +s.dataset.fullWidth || sliceW;
        const ratio = Math.max(0, (maxW - d) / maxW);
        s._targetW  = sliceW + ratio * (maxW - sliceW);
      });
    };
    container.onmouseleave = () => {
      strips.forEach(s => {
        s._targetW = s._currentW = sliceW;
        s.style.transition = 'none';
        s.style.width      = sliceW + 'px';
        requestAnimationFrame(() => s.style.transition = '');
      });
    };

    (function animate(){
      strips.forEach(s => {
        if (s._currentW == null) s._currentW = sliceW;
        if (s._targetW  == null) s._targetW  = sliceW;
        s._currentW = lerp(s._currentW, s._targetW, 0.1);
        s.style.width = s._currentW + 'px';
      });
      requestAnimationFrame(animate);
    })();
  }
})();
