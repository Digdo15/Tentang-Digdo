(function () {
    const coin = document.getElementById('profileCoin');
    if(!coin) return; // Mencegah error jika elemen tidak ditemukan

    // State
    let dragging = false;
    let lastX = 0;
    let rot = 0;           
    let velocity = 0;      
    let rafId = null;
    let snapTimer = null;
    let snapToFront = false;
    let userInteracted = false;

    // Tunables
    const AUTO_SPIN_DEG_PER_SEC = 180;
    const DRAG_SENSITIVITY = 0.6;      
    const FRICTION = 0.94;             
    const SNAP_WAIT_MS = 4000;         
    const SNAP_DURATION_MS = 700;      

    function resetSnapTimer() {
        if (snapTimer) clearTimeout(snapTimer);
        snapToFront = false;
        snapTimer = setTimeout(() => {
            snapToFront = true;
            coin.style.transition = `transform ${SNAP_DURATION_MS}ms cubic-bezier(.2,.8,.2,1)`;
        }, SNAP_WAIT_MS);
    }

    // Pointer handlers
    function pointerDown(e) {
        dragging = true;
        lastX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        velocity = 0;
        userInteracted = true;
        snapToFront = false;
        if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
        coin.style.transition = 'transform 0s';
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function pointerMove(e) {
        if (!dragging) return;
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const dx = clientX - lastX;
        lastX = clientX;
        rot += dx * DRAG_SENSITIVITY;
        velocity = dx;
        coin.style.transform = `rotateY(${rot}deg)`;
    }

    function pointerUp() {
        if (!dragging) return;
        dragging = false;
        startInertia();
        resetSnapTimer();
    }

    let lastTimestamp = performance.now();
    function animate(ts) {
        const dt = Math.max(1, ts - lastTimestamp);
        const dtSec = dt / 1000;
        lastTimestamp = ts;

        if (!dragging) {
            if (snapToFront) {
                rot = 0;
                velocity = 0;
                coin.style.transform = `rotateY(${rot}deg)`;
            } else if (Math.abs(velocity) > 0.01) {
                rot += velocity * DRAG_SENSITIVITY;
                velocity *= Math.pow(FRICTION, Math.min(4, dtSec * 60));
                if (Math.abs(velocity) < 0.02) velocity = 0;
                coin.style.transform = `rotateY(${rot}deg)`;
            } else {
                if (!userInteracted) {
                    rot += AUTO_SPIN_DEG_PER_SEC * dtSec;
                    coin.style.transform = `rotateY(${rot}deg)`;
                } else {
                    rot += (AUTO_SPIN_DEG_PER_SEC * 0.4) * dtSec;
                    coin.style.transform = `rotateY(${rot}deg)`;
                }
            }
        } 
        rafId = requestAnimationFrame(animate);
    }

    function startInertia() {
        setTimeout(() => { userInteracted = false; }, 600);
        if (!rafId) {
            lastTimestamp = performance.now();
            rafId = requestAnimationFrame(animate);
        }
    }

    // Event Listeners
    coin.addEventListener('pointerdown', function (ev) {
        coin.setPointerCapture && coin.setPointerCapture(ev.pointerId);
        pointerDown(ev);
    });
    window.addEventListener('pointermove', function (ev) { pointerMove(ev); });
    window.addEventListener('pointerup', function (ev) {
        try { coin.releasePointerCapture && coin.releasePointerCapture(ev.pointerId); } catch (e) {}
        pointerUp();
    });

    coin.addEventListener('touchstart', function (ev) { pointerDown(ev.touches[0]); }, { passive: true });
    window.addEventListener('touchmove', function (ev) { pointerMove(ev.touches[0]); }, { passive: true });
    window.addEventListener('touchend', pointerUp);

    resetSnapTimer();
    lastTimestamp = performance.now();
    rafId = requestAnimationFrame(animate);
})();