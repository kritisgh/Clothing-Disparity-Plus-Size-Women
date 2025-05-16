// js/carousel_variety_regular.js
(function(){
    const JSON_PATH_SIL = 'regular_sleeves.json';
    const container_sil = document.getElementById('carousel_variety_regular');
    let   items_sil       = [];
    let   strips_sil      = [];
    let   bracketWrappers = []; // Array to hold all bracket wrappers
    let   brackets = [];       // Array to hold all brackets
    let   texts = [];          // Array to hold all text elements

    // Define the annotation categories and their counts
    const categories = [
        { name: "strapless", count: 7 },
        { name: "straps", count: 13 },
        { name: "drape", count: 3 },
        { name: "asymmetric necklines", count: 7 },
        { name: "see through dresses", count: 5 },
        { name: "halter", count: 6 },
        { name: "interesting collar details", count: 5 }
    ];

    function lerp(a,b,t){ return a + (b-a)*t; }

    fetch(JSON_PATH_SIL)
    .then(r=>r.json())
    .then(js=> { items_sil = js;  buildCarousel(); })
    .catch(e=>console.error(e));

    function buildCarousel(){
        container_sil.innerHTML = '';
        strips_sil = [];

        // Remove any existing annotation container
        const existingAnnotationContainer = document.querySelector('.annotation-container-variety');
        if (existingAnnotationContainer) {
            existingAnnotationContainer.remove();
        }

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

        // Create annotation bars AFTER building the carousel
        createAnnotationBars(categories, sliceW, strips_sil);

        container_sil.onmousemove = e=>{
            const x = e.clientX;
            strips_sil.forEach(s=>{
              const cx    = +s.dataset.centerX,
                    d     = Math.abs(x-cx),
                    maxW  = +s.dataset.fullWidth||sliceW,
                    ratio = Math.max(0,(maxW-d)/maxW);
              s._targetW  = sliceW + ratio*(maxW-sliceW);
            });
            
            // Update all brackets width on mousemove
            updateBracketWidths(sliceW);
        };

        container_sil.onmouseleave = ()=>{
            strips_sil.forEach(s=>{
              s._targetW = s._currentW = sliceW;
              s.style.transition = 'none';
              s.style.width     = sliceW+'px';
              requestAnimationFrame(()=> s.style.transition = '');
            });

            // Reset bracket widths
            resetBracketWidths(sliceW);
        };

        (function animate(){
            strips_sil.forEach(s=>{
              if (s._currentW==null) s._currentW=sliceW;
              if (s._targetW ==null) s._targetW =sliceW;
              s._currentW = lerp(s._currentW,s._targetW,0.1);
              s.style.width = s._currentW+'px';
            });

            // Animate all brackets
            animateBrackets();
            
            requestAnimationFrame(animate);
        })();
    }

    // Function to create annotation bars
    function createAnnotationBars(categories, sliceW, strips) {
        // Create an outer container for all annotation bars
        const annotationContainer = document.createElement('div');
        annotationContainer.className = 'annotation-container-variety';
        annotationContainer.style.position = 'relative'; // Changed to relative
        
        // Calculate the width and padding to match the carousel exactly
        const style = getComputedStyle(container_sil);
        const padL = parseFloat(style.paddingLeft);
        const padR = parseFloat(style.paddingRight);
        
        // Set width to match the content area of the carousel
        annotationContainer.style.width = `${container_sil.clientWidth - padL - padR}px`;
        annotationContainer.style.marginTop = '10px'; // Add margin for spacing
        
        // Match the padding of the carousel to align content perfectly
        annotationContainer.style.paddingLeft = style.paddingLeft;
        annotationContainer.style.paddingRight = style.paddingRight;
        annotationContainer.style.boxSizing = 'content-box'; // Ensure padding adds to width
        
        // Add directly after the carousel_variety_regular container
        annotationContainer.style.display = 'flex';
        annotationContainer.style.flexDirection = 'column';
        annotationContainer.style.alignItems = 'flex-start';
        annotationContainer.style.marginBottom = '20px';
        
        // Insert directly after the carousel_variety_regular element
        container_sil.parentNode.insertBefore(annotationContainer, container_sil.nextSibling);
        
        // Clear previous bracket arrays
        bracketWrappers = [];
        brackets = [];
        texts = [];
        
        // Create a single row for all brackets
        const bracketRow = document.createElement('div');
        bracketRow.style.display = 'flex';
        bracketRow.style.width = '100%';
        bracketRow.style.position = 'relative';
        bracketRow.style.height = '50px'; // Height for brackets and labels
        annotationContainer.appendChild(bracketRow);
        
        // Track the starting index for each category
        let startIndex = 0;
        
        // Create brackets for each category
        categories.forEach((category, catIndex) => {
            // Create a bracket wrapper for this category
            const wrapper = document.createElement('div');
            wrapper.style.width = `${sliceW * category.count}px`;
            wrapper.style.boxSizing = 'border-box';
            wrapper.style.position = 'relative';
            wrapper.style.height = '100%';
            wrapper._currentWidth = sliceW * category.count;
            wrapper._targetWidth = sliceW * category.count;
            wrapper._startIndex = startIndex;
            wrapper._endIndex = startIndex + category.count - 1;
            bracketRow.appendChild(wrapper);
            bracketWrappers.push(wrapper);
            
            // Create the bracket (always full-width of wrapper)
            const bracket = document.createElement('div');
            bracket.style.height = '12px';
            bracket.style.borderLeft = '1px solid black';
            bracket.style.borderBottom = '1px solid black';
            bracket.style.borderRight = '1px solid black';
            bracket.style.boxSizing = 'border-box';
            bracket.style.width = '100%';
            wrapper.appendChild(bracket);
            brackets.push(bracket);
            
            // Add the caption centered under the bracket
            const text = document.createElement('div');
            text.textContent = category.name;
            text.style.fontFamily = 'Arial, sans-serif';
            text.style.fontSize = '12px';
            text.style.lineHeight = '12px';
            text.style.color = '#333';
            text.style.position = 'absolute';
            text.style.left = '0px';
            text.style.top = `${bracket.offsetHeight + 2}px`;
            text.style.width = '100%';
            text.style.textAlign = 'center';
            wrapper.appendChild(text);
            texts.push(text);
            
            // Update start index for next category
            startIndex += category.count;
        });
    }
    
    // Function to update bracket widths during mousemove
    function updateBracketWidths(sliceW) {
        bracketWrappers.forEach(wrapper => {
            let totalWidth = 0;
            for (let i = wrapper._startIndex; i <= wrapper._endIndex; i++) {
                if (i < strips_sil.length) {
                    totalWidth += strips_sil[i]._targetW || sliceW;
                }
            }
            wrapper._targetWidth = totalWidth;
        });
    }
    
    // Function to reset bracket widths on mouseleave
    function resetBracketWidths(sliceW) {
        bracketWrappers.forEach(wrapper => {
            const categoryCount = wrapper._endIndex - wrapper._startIndex + 1;
            wrapper._targetWidth = sliceW * categoryCount;
        });
    }
    
    // Function to animate brackets
    function animateBrackets() {
        bracketWrappers.forEach(wrapper => {
            wrapper._currentWidth = lerp(wrapper._currentWidth, wrapper._targetWidth, 0.08);
            wrapper.style.width = `${wrapper._currentWidth}px`;
        });
    }
    
    // Function to determine which category an image belongs to based on its index
    function getCategoryForIndex(index) {
        let currentIndex = 0;
        
        for (const category of categories) {
            if (index < currentIndex + category.count) {
                return category.name;
            }
            currentIndex += category.count;
        }
        
        return "uncategorized"; // Fallback
    }
})();