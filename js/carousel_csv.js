// Path to your JSON file
const JSON_PATH = 'plusimg.json';
const container = document.getElementById('carousel');
const strips    = [];

// Linear interpolation helper
function lerp(start, end, t) {
  return start + (end - start) * t;
}

fetch(JSON_PATH)
  .then(res => res.json())
  .then(items => {
    // 1) Measure carousel & compute slice width
    const style      = getComputedStyle(container);
    const padLeft    = style.paddingLeft;
    const padRight   = style.paddingRight;
    const totalWidth = container.clientWidth - parseFloat(padLeft) - parseFloat(padRight);
    const sliceW     = totalWidth / items.length;
    document.documentElement.style.setProperty('--slice-width', `${sliceW}px`);

    // 2) Precompute slice centers
    const rect    = container.getBoundingClientRect();
    const centers = items.map((_, i) =>
      rect.left + parseFloat(padLeft) + sliceW * (i + 0.5)
    );

    // 3) Build strips
    items.forEach((item,i) => {
      if (!item.imageUrl) return;
      const strip = document.createElement('div');
      strip.className       = 'strip';
      strip.dataset.centerX = centers[i];
      container.appendChild(strip);
      strips.push(strip);

      const img = document.createElement('img');
      img.className        = 'full';
      img.src              = item.imageUrl;
      img.alt              = item.title || '';
      img.style.visibility = 'hidden';
      strip.appendChild(img);

      img.addEventListener('load', () => {
        const natW  = img.naturalWidth,
              natH  = img.naturalHeight,
              dispH = strip.clientHeight,
              rawW  = natW * (dispH / natH),
              fullW = Math.min(rawW, totalWidth);
        strip.dataset.fullWidth = fullW;
        img.style.visibility    = '';
      });
    });

    // 4) Insert annotation wrapper just below carousel
    const wrapper = document.createElement('div');
    // match carousel width & centering
    wrapper.style.width        = `${container.clientWidth}px`;
    wrapper.style.margin       = '0 auto';
    wrapper.style.paddingLeft  = padLeft;
    wrapper.style.paddingRight = padRight;
    wrapper.style.boxSizing    = 'border-box';
    container.after(wrapper);

    // 5) Add text and bracket inside wrapper
    const text = document.createElement('div');
    text.textContent          = 'the only 9 short dresses available';
    text.style.fontFamily     = 'Arial, sans-serif';
    text.style.fontSize       = '12px';
    text.style.lineHeight     = '12px';
    text.style.color          = '#333';
    text.style.marginBottom   = '2px';
    text.style.textAlign      = 'left';
    wrapper.appendChild(text);

    const bracket = document.createElement('div');
    bracket.style.height        = '12px';
    bracket.style.borderLeft    = '1px solid black';
    bracket.style.borderBottom  = '1px solid black';
    bracket.style.borderRight   = '1px solid black';
    bracket.style.boxSizing     = 'border-box';
    bracket.style.transition    = 'width 0.2s ease';
    // start full 9-slice width
    bracket.style.width = `${sliceW * 9}px`;
    wrapper.appendChild(bracket);

    // 6) Mousemove → update strips & bracket
    container.addEventListener('mousemove', e => {
      const x = e.clientX;
      // find hovered index
      let minIdx = 0, minD = Infinity;
      centers.forEach((cx, idx) => {
        const d = Math.abs(x - cx);
        if (d < minD) { minD = d; minIdx = idx; }
      });
      // expand strips
      strips.forEach(strip => {
        const maxW  = parseFloat(strip.dataset.fullWidth) || sliceW;
        const d     = Math.abs(x - parseFloat(strip.dataset.centerX));
        const ratio = Math.max(0, (maxW - d)/maxW);
        strip._targetW = sliceW + ratio*(maxW - sliceW);
      });
      // adjust bracket to cover hovered slice count (capped at 9)
      const count = Math.min(minIdx+1, 9);
      bracket.style.width = `${sliceW * count}px`;
    });

    // 7) Mouseleave → snap back instantly
    container.addEventListener('mouseleave', () => {
      strips.forEach(strip => {
        strip._targetW = strip._currentW = sliceW;
        strip.style.transition = 'none';
        strip.style.width      = `${sliceW}px`;
        requestAnimationFrame(() => strip.style.transition = '');
      });
      bracket.style.width = `${sliceW * 9}px`;
    });

    // 8) Animation loop for smooth resizing
    (function animate() {
      strips.forEach(strip => {
        if (strip._currentW == null) strip._currentW = sliceW;
        if (strip._targetW  == null) strip._targetW  = sliceW;
        strip._currentW = lerp(strip._currentW, strip._targetW, 0.1);
        strip.style.width = `${strip._currentW}px`;
      });
      requestAnimationFrame(animate);
    })();
  })
  .catch(err => console.error(err));
