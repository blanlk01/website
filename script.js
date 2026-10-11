// Ensure window.fetch has both getter and setter for browser extensions/interceptors
try {
    let _fetchRef = window.fetch;
    Object.defineProperty(window, 'fetch', {
        get() { return _fetchRef; },
        set(fn) { _fetchRef = fn; },
        configurable: true,
        enumerable: true
    });
} catch (_) {}

// ================= EDIT YOUR PHOTOS HERE =================
// cutout: a PNG with transparent background (best result). Leave "" to use the fallback frame.
// main: link to your portrait photo. Add your photo URL below.
const PHOTOS = {
    cutout: "",
    main: ""
};
// =========================================================


// ---------- 1. Hero Image Setup ----------
// Configures the portrait cutout or fallback slanted frame
const stage = document.getElementById("stage");
const imgBase = document.getElementById("imgBase");
const src = PHOTOS.cutout || PHOTOS.main;

if (src) {
    imgBase.src = src;
} else {
    // If no image is provided, hide image element so styled black frame shows
    imgBase.style.display = "none";
}

if (!PHOTOS.cutout) {
    stage.classList.add("no-cutout");
}


// ---------- 2. Fullscreen Loader ----------
// Counts up from 0 to 100% and slides the pink loader upward
const pct = document.getElementById("pct");
const loader = document.getElementById("loader");
let count = 0;

const loadInterval = setInterval(() => {
    count += Math.ceil(Math.random() * 9);
    if (count >= 100) {
        count = 100;
        clearInterval(loadInterval);
        setTimeout(() => {
            loader.classList.add("done");
        }, 300);
    }
    pct.textContent = count;
}, 65);


// ---------- 3. Navigation Menu ----------
// Toggles the circular reveal fullscreen menu and accessibility attributes
const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");

function toggleMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
}

menuBtn.addEventListener("click", () => {
    toggleMenu(!menu.classList.contains("open"));
});

menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => toggleMenu(false));
});

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        toggleMenu(false);
    }
});


// ---------- 4. Hover Blue Spotlight Reveal Animation ----------
// The whole picture is black; ONLY the specific area hovered by the mouse turns blue!
const hero = document.getElementById("hero");
const duo = document.getElementById("duoCanvas");
const dctx = duo.getContext("2d");

const photo = new Image();
photo.referrerPolicy = "no-referrer";
if (src) {
    photo.src = src;
}

// Low-resolution canvas for fast and smooth metaball rendering
const low = document.createElement("canvas");
const lctx = low.getContext("2d", { willReadFrequently: true });

// Threshold canvas for sharp, liquid spotlight edges
const thr = document.createElement("canvas");
const tctx = thr.getContext("2d");

let W = 0, H = 0, LW = 40, LH = 50, dpr = 1;
const pos = { x: 0, y: 0 };
const target = { x: 0, y: 0 };
let active = false;
let opacity = 0; // Controls spotlight visibility so photo is black when idle

function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    duo.width = Math.max(1, W * dpr);
    duo.height = Math.max(1, H * dpr);
    LW = low.width = thr.width = Math.max(40, Math.round(W / 5));
    LH = low.height = thr.height = Math.max(50, Math.round(H / 5));
    pos.x = target.x = LW / 2;
    pos.y = target.y = LH / 2;
}

window.addEventListener("resize", resize);
resize();

// Track mouse position over the portrait area
hero.addEventListener("pointermove", e => {
    const rect = stage.getBoundingClientRect();
    // Check if pointer is hovering over or near the stage portrait
    const isOverStage = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    );

    if (isOverStage) {
        target.x = ((e.clientX - rect.left) / rect.width) * LW;
        target.y = ((e.clientY - rect.top) / rect.height) * LH;
        active = true;
    } else {
        active = false;
    }
});

hero.addEventListener("pointerleave", () => {
    active = false;
});

// Draws portrait photo fitting cover/contain rules into the blue duotone canvas
function drawPhoto() {
    if (photo.complete && photo.naturalWidth) {
        const cover = !PHOTOS.cutout;
        const iw = photo.naturalWidth;
        const ih = photo.naturalHeight;
        const scale = cover ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih);
        const w = iw * scale;
        const h = ih * scale;
        dctx.drawImage(photo, ((W - w) / 2) * dpr, (cover ? 0 : H - h) * dpr, w * dpr, h * dpr);
    } else {
        // Fallback: vivid electric blue fill so liquid blob reveals vibrant blue
        dctx.fillStyle = "#2563eb";
        dctx.fillRect(0, 0, duo.width, duo.height);
    }
}

function frame(time) {
    // 1. Smoothly transition spotlight opacity: 1 when mouse is hovering, 0 when not
    opacity += ((active ? 1 : 0) - opacity) * 0.15;

    // 2. Clear canvas when completely idle (keeping photo pure black)
    dctx.clearRect(0, 0, duo.width, duo.height);

    if (opacity > 0.01) {
        // Easing cursor follower toward mouse coordinates
        pos.x += (target.x - pos.x) * 0.22;
        pos.y += (target.y - pos.y) * 0.22;

        const radius = LW * 0.18; // Spotlight radius localized around cursor

        // Fade existing trail
        lctx.globalCompositeOperation = "destination-out";
        lctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        lctx.fillRect(0, 0, LW, LH);
        lctx.globalCompositeOperation = "source-over";

        // Paint soft radial spotlight circle right where the mouse is hovering
        if (active) {
            for (let i = 0; i < 3; i++) {
                const angle = time / 300 + i * 2.1;
                const cx = pos.x + Math.cos(angle) * (radius * 0.25);
                const cy = pos.y + Math.sin(angle * 1.2) * (radius * 0.25);
                const gradient = lctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                lctx.fillStyle = gradient;
                lctx.beginPath();
                lctx.arc(cx, cy, radius, 0, Math.PI * 2);
                lctx.fill();
            }
        }

        // 3. Threshold soft blobs to produce a viscous liquid spotlight edge
        if (LW > 0 && LH > 0) {
            const imgData = lctx.getImageData(0, 0, LW, LH);
            const data = imgData.data;
            for (let i = 3; i < data.length; i += 4) {
                const alpha = Math.min(Math.max((data[i] / 255 - 0.25) / 0.3, 0), 1);
                data[i] = alpha * alpha * (3 - 2 * alpha) * 255 * opacity;
                data[i - 1] = data[i - 2] = data[i - 3] = 255;
            }
            tctx.putImageData(imgData, 0, 0);
        }

        // 4. Composite photo with the cursor spotlight mask (shows blue ONLY where mouse hovers)
        dctx.globalCompositeOperation = "source-over";
        drawPhoto();
        dctx.globalCompositeOperation = "destination-in";
        dctx.imageSmoothingEnabled = true;
        dctx.imageSmoothingQuality = "high";
        dctx.drawImage(thr, 0, 0, duo.width, duo.height);
        dctx.globalCompositeOperation = "source-over";
    }

    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);


// ---------- 5. Word-by-Word Story Text Lighting ----------
// Splits story text into individual span words that illuminate on scroll
const bigText = document.querySelector(".big");
if (bigText) {
    const rawWords = bigText.textContent.trim().split(/\s+/);
    bigText.innerHTML = rawWords.map(w => `<span class="w">${w}</span>`).join(" ");
}
const storyWords = document.querySelectorAll(".big .w");


// ---------- 6. Pinned Horizontal Rail Scroll ----------
// Drives horizontal track scroll and story lighting from vertical window scroll
const rail = document.getElementById("rail");
const track = document.getElementById("track");

function onScroll() {
    // Horizontal photo strip calculation
    if (rail && track) {
        const railRect = rail.getBoundingClientRect();
        const maxScroll = rail.offsetHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(Math.max(-railRect.top / maxScroll, 0), 1) : 0;
        const maxTrackShift = track.scrollWidth - window.innerWidth;
        if (maxTrackShift > 0) {
            track.style.transform = `translateX(${-progress * maxTrackShift}px)`;
        }
    }

    // Story word illumination calculation
    if (bigText && storyWords.length) {
        const textRect = bigText.getBoundingClientRect();
        const scrollFraction = Math.min(
            Math.max((window.innerHeight * 0.85 - textRect.top) / (textRect.height + window.innerHeight * 0.3), 0),
            1
        );
        storyWords.forEach((word, index) => {
            word.classList.toggle("lit", index < scrollFraction * storyWords.length);
        });
    }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();


// ---------- 7. 3D Flip Cards Interaction ----------
// Toggles card rotation on click/tap and accessible keyboard Enter/Space
document.querySelectorAll(".flip").forEach(card => {
    card.addEventListener("click", () => {
        card.classList.toggle("on");
    });
    card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            card.classList.toggle("on");
        }
    });
});


// ---------- 8. Animated Count-Up Numbers ----------
// Numbers increment with smooth cubic easing when scrolled into view
function countUp(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    const startTime = performance.now();
    const duration = 1600;

    function tick(now) {
        const elapsed = Math.min((now - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - elapsed, 3);
        el.textContent = Math.round(target * easeOut) + suffix;
        if (elapsed < 1) {
            requestAnimationFrame(tick);
        }
    }
    requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                countUp(entry.target);
                countObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));