// Utilitarian Design Logic & Animations

document.addEventListener('DOMContentLoaded', () => {
    initHeroAnimation();
    initStateAnimation();
    initPerformanceAnimation();
    initCursorTracker();
    initMobileMenu();

    // Handle Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            initHeroAnimation();
        }, 200);
    });
});

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    
    if (!btn || !menu) return;

    let isOpen = false;

    btn.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            menu.classList.remove('translate-x-full');
            btn.textContent = 'CLOSE';
            btn.classList.add('bg-util-accent', 'text-black');
            btn.classList.remove('text-white');
        } else {
            menu.classList.add('translate-x-full');
            btn.textContent = 'MENU';
            btn.classList.remove('bg-util-accent', 'text-black');
            btn.classList.add('text-white');
        }
    });
    
    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            isOpen = false;
            menu.classList.add('translate-x-full');
            btn.textContent = 'MENU';
            btn.classList.remove('bg-util-accent', 'text-black');
            btn.classList.add('text-white');
        });
    });
}

// 1. Hero Animation: Interactive "Icon" Grid
function initHeroAnimation() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    container.appendChild(svg);

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Grid settings
    const gridSize = 40; 
    const rows = Math.ceil(height / gridSize);
    const cols = Math.ceil(width / gridSize);
    const nodes = [];

    // Create a grid of "Plus" shapes (+) to represent anchor points
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const group = document.createElementNS(svgNS, "g");
            const x = c * gridSize + gridSize/2;
            const y = r * gridSize + gridSize/2;
            
            group.setAttribute("transform", `translate(${x}, ${y})`);
            
            // The Shape (Plus)
            const shape = document.createElementNS(svgNS, "path");
            // Draw a small plus sign
            const size = 4;
            shape.setAttribute("d", `M -${size} 0 L ${size} 0 M 0 -${size} L 0 ${size}`);
            shape.setAttribute("stroke", "#333");
            shape.setAttribute("stroke-width", "1");
            
            group.appendChild(shape);
            svg.appendChild(group);

            nodes.push({ group, shape, x, y, baseScale: 1 });
        }
    }

    // Interaction State
    let mouseX = -1000;
    let mouseY = -1000;
    
    // Auto-scan lines
    const scanners = [
        { y: 0, speed: 2, color: '#ff3300' },
        { y: height/2, speed: 3, color: '#ffffff' }
    ];

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    container.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    function animate() {
        if (!document.body.contains(svg)) return;

        // Update scanners
        scanners.forEach(scan => {
            scan.y += scan.speed;
            if (scan.y > height) scan.y = -100;
        });

        nodes.forEach(node => {
            let scale = 1;
            let color = "#333";
            let rotation = 0;
            let width = 1;

            // 1. Mouse Interaction (Hover effect)
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const hoverRadius = 150;

            if (dist < hoverRadius) {
                const factor = 1 - (dist / hoverRadius);
                scale = 1 + factor * 2; // Scale up to 3x
                rotation = factor * 90; // Rotate up to 90deg
                color = "#ff3300"; // Accent color
                width = 1 + factor * 2;
            }

            // 2. Scanner Interaction
            scanners.forEach(scan => {
                const scanDist = Math.abs(node.y - scan.y);
                if (scanDist < 60) {
                     const scanFactor = 1 - (scanDist / 60);
                     if (scanFactor > 0.5) { // Only affect those very close
                         color = scan.color === '#ffffff' ? '#ffffff' : '#ff3300';
                         scale = Math.max(scale, 1 + scanFactor);
                     }
                }
            });

            // Apply transforms
            node.group.setAttribute("transform", `translate(${node.x}, ${node.y}) rotate(${rotation}) scale(${scale})`);
            node.shape.setAttribute("stroke", color);
            node.shape.setAttribute("stroke-width", width);
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// 2. State Logic Animation (Menu -> Close Morph)
function initStateAnimation() {
    const container = document.getElementById('state-icon-container');
    const valDisplay = document.getElementById('state-val');
    
    if(!container) return;
    container.innerHTML = '';

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100px");
    svg.setAttribute("height", "100px");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.style.overflow = "visible";
    container.appendChild(svg);

    // Three lines for Hamburger / X
    const lines = [];
    const yPositions = [6, 12, 18];
    
    yPositions.forEach(y => {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "4");
        line.setAttribute("x2", "20");
        line.setAttribute("y1", y);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "white");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-linecap", "square");
        lines.push(line);
        svg.appendChild(line);
    });

    let state = 'menu'; // menu or close
    let progress = 0;
    let direction = 1; // 1 for forward (to X), -1 for backward (to Menu)
    let isPaused = false;

    function animate() {
        if (!isPaused) {
            progress += 0.02 * direction;
            
            if (progress >= 1) {
                progress = 1;
                isPaused = true;
                state = 'close';
                if(valDisplay) valDisplay.innerText = "STATE: ACTIVE";
                setTimeout(() => { isPaused = false; direction = -1; }, 2000);
            } else if (progress <= 0) {
                progress = 0;
                isPaused = true;
                state = 'menu';
                if(valDisplay) valDisplay.innerText = "STATE: IDLE";
                setTimeout(() => { isPaused = false; direction = 1; }, 2000);
            }

            // Interpolate
            // Line 1: y=6 -> y=12, rotate 45
            // Line 2: opacity 1 -> 0
            // Line 3: y=18 -> y=12, rotate -45

            const ease = t => t<.5 ? 2*t*t : -1+(4-2*t)*t; // EaseInOutQuad
            const p = ease(progress);

            // Line 1
            const y1 = 6 + (6 * p); // 6 -> 12
            lines[0].setAttribute("y1", y1);
            lines[0].setAttribute("y2", y1);
            lines[0].setAttribute("transform", `rotate(${45 * p}, 12, 12)`);
            lines[0].setAttribute("stroke", p > 0.5 ? "#ff3300" : "white");

            // Line 2
            lines[1].setAttribute("opacity", 1 - p);

            // Line 3
            const y3 = 18 - (6 * p); // 18 -> 12
            lines[2].setAttribute("y1", y3);
            lines[2].setAttribute("y2", y3);
            lines[2].setAttribute("transform", `rotate(${-45 * p}, 12, 12)`);
            lines[2].setAttribute("stroke", p > 0.5 ? "#ff3300" : "white");
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}

// 3. Performance Animation (Tiny Footprint / Compression)
function initPerformanceAnimation() {
    const container = document.getElementById('performance-icon-container');
    if(!container) return;

    // Clear just in case
    container.innerHTML = '';

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 48 48");
    container.appendChild(svg);

    // Outer Circle (Static)
    const outerRing = document.createElementNS(svgNS, "circle");
    outerRing.setAttribute("cx", "24");
    outerRing.setAttribute("cy", "24");
    outerRing.setAttribute("r", "20");
    outerRing.setAttribute("stroke", "#333");
    outerRing.setAttribute("stroke-width", "1");
    outerRing.setAttribute("fill", "none");
    svg.appendChild(outerRing);

    // Active Sector (Spinning)
    const sector = document.createElementNS(svgNS, "path");
    sector.setAttribute("fill", "#ff3300");
    sector.setAttribute("opacity", "0.8");
    svg.appendChild(sector);

    // Center Text
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "24");
    text.setAttribute("y", "28"); // visual center adjust
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#fff");
    text.setAttribute("font-size", "10");
    text.setAttribute("font-family", "monospace");
    text.textContent = "1.8K";
    svg.appendChild(text);

    let angle = 0;
    function animate() {
        angle += 4;
        
        // Calculate pie slice
        const rad = angle * (Math.PI / 180);
        // A sweeping arc of 60 degrees
        const startAngle = angle;
        const endAngle = angle + 90;

        const x1 = 24 + 16 * Math.cos(startAngle * Math.PI/180);
        const y1 = 24 + 16 * Math.sin(startAngle * Math.PI/180);
        
        const x2 = 24 + 16 * Math.cos(endAngle * Math.PI/180);
        const y2 = 24 + 16 * Math.sin(endAngle * Math.PI/180);

        // SVG Path for arc
        const d = `M 24 24 L ${x1} ${y1} A 16 16 0 0 1 ${x2} ${y2} Z`;
        sector.setAttribute("d", d);

        requestAnimationFrame(animate);
    }
    animate();
}

function initCursorTracker() {
    // Optional
}
