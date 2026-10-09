import { hash32, rng32 } from './horns.js';

// A pearl's look depends only on its stable identity (id, rarity, seed), never on gameplay RNG.
export function pearlSVG(pearl, scope = 'case', size = 120) {
  const random = rng32(hash32(`pearl-art:${pearl.id}:${pearl.r}:${pearl.seed}`));
  const n = (a, b) => a + (b - a) * random(), f = v => v.toFixed(2);
  const id = `pearl-${scope}-${pearl.id}`, hue = Math.floor(n(0, 360));
  const tints = [[34, 8, 62], [210, 30, 72], [hue, 36, 68], [44, 80, 66], [350, 70, 72]][pearl.r];
  const [h, s, l] = tints, hsl = (dh, ds, dl) => `hsl(${(h + dh + 360) % 360} ${Math.max(0, Math.min(100, s + ds))}% ${Math.max(5, Math.min(97, l + dl))}%)`;
  let extra = '';
  if (pearl.r >= 1) extra += `<ellipse cx="60" cy="60" rx="${f(n(34, 40))}" ry="${f(n(30, 36))}" fill="none" stroke="${hsl(60, 10, 18)}" stroke-opacity=".35" stroke-width="3" transform="rotate(${f(n(-35, 35))} 60 60)"/>`;
  if (pearl.r >= 2) extra += `<path d="M30 70 Q60 ${f(n(84, 94))} 90 68" fill="none" stroke="${hsl(-70, 20, 14)}" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>`;
  if (pearl.r >= 3) extra += `<circle cx="60" cy="60" r="55" fill="none" stroke="#ffd98a" stroke-opacity=".55" stroke-width="2.5"/>`;
  if (pearl.r >= 4) for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + n(-.1, .1), x1 = 60 + Math.cos(a) * 52, y1 = 60 + Math.sin(a) * 52, x2 = 60 + Math.cos(a) * 59, y2 = 60 + Math.sin(a) * 59;
    extra += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="#fff3c4" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return `<svg class="pearl-art" data-pearl-art-id="${pearl.id}" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="${id}-g" cx=".34" cy=".28" r=".85"><stop stop-color="#fff" /><stop offset=".25" stop-color="${hsl(0, 10, 18)}"/><stop offset=".7" stop-color="${hsl(0, 0, 0)}"/><stop offset="1" stop-color="${hsl(25, 10, -26)}"/></radialGradient></defs>
    <ellipse cx="60" cy="108" rx="34" ry="5" fill="#000" opacity=".12"/>
    <circle cx="60" cy="58" r="44" fill="url(#${id}-g)"/>${extra}
    <ellipse cx="46" cy="40" rx="12" ry="7" fill="#fff" opacity=".7" transform="rotate(-28 46 40)"/>
    <circle cx="74" cy="76" r="4" fill="#fff" opacity=".28"/></svg>`;
}
