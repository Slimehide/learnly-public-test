(() => {
  'use strict';

  const canvas = document.getElementById('starfield');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      stars = Array.from({ length: Math.floor(w * h / 22000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.3 + 0.4) * devicePixelRatio,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.05 * devicePixelRatio
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = t => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (const star of stars) {
        star.x = (star.x + star.vx + w) % w;
        ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t / 1000 * star.s + star.p));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw(0);
  }

  document.querySelectorAll('.session-pills').forEach(group => {
    group.addEventListener('click', e => {
      const pill = e.target.closest('.session-pill');
      if (!pill || pill.disabled) return;
      group.querySelectorAll('.session-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
})();
