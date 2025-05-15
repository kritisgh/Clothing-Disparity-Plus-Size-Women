// Path to your JSON file
const JSON_PATH = 'plusimg.json';
const container = document.getElementById('carousel');
const strips = [];

// Linear interpolation helper
function lerp(start, end, t) {
  return start + (end - start) * t;
}

fetch(JSON_PATH)
  .then(res => res.json())
  .then(items => {
    // 1) Measure the carousel container and compute slice width
    const style = getComputedStyle(container);
    const paddingLeft  = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const totalWidth = container.clientWidth - paddingLeft - paddingRight;
    const sliceW = totalWidth / items.length;
    document.documentElement.style.setProperty('--slice-width', `${sliceW}px`);

    // 2) Pre-compute the static centerX for each slice
    const containerRect = container.getBoundingClientRect();
    const centers = items.map((_, i) =>
      containerRect.left + paddingLeft + sliceW * (i + 0.5)
    );

    // 3) Build each strip
    items.forEach((item, index) => {
      const url = item.imageUrl;
      if (!url) return;

      const strip = document.createElement('div');
      strip.className = 'strip';
      // stash our precomputed centerX
      strip.dataset.centerX = centers[index];
      container.appendChild(strip);
      strips.push(strip);

      const img = document.createElement('img');
      img.className = 'full';
      img.src = url;
      img.alt = item.title || '';
      img.style.visibility = 'hidden';
      strip.appendChild(img);

      img.addEventListener('load', () => {
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;
        const dispH = strip.clientHeight;
        const rawW = natW * (dispH / natH);
        // cap so it never exceeds the carousel's inner width
        const fullW = Math.min(rawW, totalWidth);
        strip.dataset.fullWidth = fullW;
        img.style.visibility = '';
      });
    });

    // 4) On mousemove: calculate target width based on distance to static center
    container.addEventListener('mousemove', e => {
      const x = e.clientX;
      strips.forEach(strip => {
        const centerX = parseFloat(strip.dataset.centerX);
        const d = Math.abs(x - centerX);
        const maxW = parseFloat(strip.dataset.fullWidth) || sliceW;
        const ratio = Math.max(0, (maxW - d) / maxW);
        strip._targetW = sliceW + ratio * (maxW - sliceW);
      });
    });

    // 5) On mouseleave: snap all back instantly
    container.addEventListener('mouseleave', () => {
      strips.forEach(strip => {
        strip._targetW = strip._currentW = sliceW;
        strip.style.transition = 'none';
        strip.style.width = `${sliceW}px`;
        requestAnimationFrame(() => {
          strip.style.transition = '';
        });
      });
    });

    // 6) Animation loop: tween current → target for buttery smooth
    function animate() {
      strips.forEach(strip => {
        if (strip._currentW == null) strip._currentW = sliceW;
        if (strip._targetW == null) strip._targetW = sliceW;
        strip._currentW = lerp(strip._currentW, strip._targetW, 0.1);
        strip.style.width = `${strip._currentW}px`;
      });
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  })
  .catch(err => console.error('Failed to load JSON:', err));

  