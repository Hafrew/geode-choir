import { hash32, rng32 } from './horns.js';

// Appearance depends only on the item's stable identity, never quality or gameplay RNG.
export function shellSVG(shell, scope = 'inventory') {
  const random = rng32(hash32(`shell:${shell.id}:${shell.r}`));
  const n = (a, b) => a + (b - a) * random();
  const f = value => value.toFixed(2);
  const id = `shell-${scope}-${shell.id}`;
  const colors = [
    ['#fff2d5', '#d8b592', '#9b715b'],
    ['#d6fff0', '#7faec5', '#756da7'],
    ['#ffffff', '#b4dbe6', '#9884c7'],
  ][shell.r];
  let body = '', marks = '';
  const tilt = f(n(-9, 9));
  if (shell.r === 0) {
    const lobes = 7 + Math.floor(n(0, 3)), radius = n(65, 73);
    const points = Array.from({ length: lobes + 1 }, (_, i) => {
      const angle = Math.PI + i * Math.PI / lobes;
      return [100 + Math.cos(angle) * radius, 117 + Math.sin(angle) * radius];
    });
    let outline = 'M 89 132 Q 78 130 76 117';
    outline += ` L ${f(points[0][0])} ${f(points[0][1])}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], angle = Math.PI + (i - .5) * Math.PI / lobes;
      outline += ` Q ${f(100 + Math.cos(angle) * (radius + 10))} ${f(117 + Math.sin(angle) * (radius + 10))} ${f(b[0])} ${f(b[1])}`;
      marks += `<path d="M100 123 Q${f((a[0]+100)/2)} ${f(a[1]+16)} ${f(a[0])} ${f(a[1]+2)}"/>`;
    }
    outline += ' L124 117 Q122 130 111 132 Z';
    body = `<path d="${outline}" fill="url(#${id}-body)" stroke="${colors[2]}" stroke-width="1.8"/>`;
    marks = `<g fill="none" stroke="${colors[2]}" stroke-opacity=".42" stroke-width="1.5">${marks}</g>
      <path d="M87 126 Q100 120 113 126" fill="none" stroke="#fff6e4" stroke-width="3"/>`;
  } else if (shell.r === 1) {
    body = `<path d="M141 116 C169 91 156 43 124 29 C86 10 43 37 39 76 C35 109 61 131 93 130 L128 142 Q143 134 141 116Z" fill="url(#${id}-body)" stroke="${colors[2]}" stroke-width="1.8"/>
      <path d="M101 83 C95 71 80 78 84 91 C90 110 123 100 120 76 C116 43 69 39 58 72 C44 116 112 139 139 103" fill="none" stroke="#ecfff6" stroke-width="6"/>
      <path d="M101 83 C95 71 80 78 84 91 C90 110 123 100 120 76 C116 43 69 39 58 72 C44 116 112 139 139 103" fill="none" stroke="${colors[2]}" stroke-opacity=".6" stroke-width="1.8"/>
      <path d="M128 106 Q155 113 133 137 Q119 130 115 121Z" fill="#45536f" stroke="#c9fff1" stroke-width="2"/>`;
    for (let i = 0; i < 8; i++) {
      const a = .45 + i * .39, x = 99 + Math.cos(a) * 54, y = 77 + Math.sin(a) * 46;
      marks += `<path d="M${f(x)} ${f(y)} l${f(n(-9,-5))} ${f(n(-7,-3))}" stroke="#caffee" stroke-width="2" stroke-linecap="round"/>`;
    }
    marks += '<path d="M53 61 Q66 33 95 30" fill="none" stroke="#f0fff8" stroke-width="3" stroke-linecap="round" opacity=".65"/>';
  } else {
    body = `<path d="M52 96 L29 90 L50 79 L38 64 L64 66 L63 39 L86 54 L100 24 L113 53 L140 38 L137 65 L166 62 L148 84 L170 99 L145 104 Q131 119 115 117 L115 143 Q101 155 96 136 L83 116 Q65 117 52 96Z" fill="url(#${id}-body)" stroke="#ddc9a0" stroke-width="1.8"/>
      <path d="M86 104 Q61 81 91 60 Q119 45 137 81 Q149 110 120 119 Q103 125 101 142" fill="none" stroke="#fff9eb" stroke-width="7"/>
      <path d="M86 104 Q61 81 91 60 Q119 45 137 81 Q149 110 120 119 Q103 125 101 142" fill="none" stroke="#9682ba" stroke-opacity=".65" stroke-width="1.6"/>
      <ellipse cx="112" cy="95" rx="17" ry="24" transform="rotate(-22 112 95)" fill="#596586" stroke="#fff8e9" stroke-width="3"/>
      <ellipse cx="111" cy="94" rx="10" ry="17" transform="rotate(-22 111 94)" fill="url(#${id}-pearl)"/>`;
    for (let i = 0; i < 9; i++) {
      const x = n(66, 133), y = n(63, 107);
      marks += `<path d="M${f(x-3)} ${f(y)} L${f(x)} ${f(y-4)} L${f(x+3)} ${f(y)} L${f(x)} ${f(y+4)}Z" fill="#ffe7a8" opacity=".8"/>`;
    }
    marks += '<path d="M100 26 L104 39 M140 40 L133 52 M165 63 L152 70" stroke="#fff8dd" stroke-width="2" stroke-linecap="round"/>';
  }
  return `<svg class="shell-art" data-shell-art-id="${shell.id}" viewBox="0 0 200 170" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}-body" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".5" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient>
    <radialGradient id="${id}-pearl" cx=".35" cy=".25"><stop stop-color="#fffce9"/><stop offset=".5" stop-color="#d5f4ef"/><stop offset="1" stop-color="#bca3e4"/></radialGradient></defs>
    <ellipse cx="100" cy="148" rx="62" ry="8" fill="${colors[2]}" opacity=".13"/>
    ${shell.r ? `<ellipse cx="100" cy="83" rx="84" ry="68" fill="${colors[1]}" opacity=".08"/>` : ''}
    <g transform="rotate(${tilt} 100 90)">${body}${marks}</g></svg>`;
}
