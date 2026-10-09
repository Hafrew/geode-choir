// A convenience lock for the developer toolbar, not security: this is a static, single-player game, so anything the
// browser can check, a determined person can bypass. The lock keeps the tools (and their code) away from ordinary play.
async function hashCode(code, salt) {
  const data = new TextEncoder().encode(`${salt}:${String(code ?? '').trim().toUpperCase().replace(/[\s-]+/g, '')}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyCode(code, config) {
  if (!config || !config.salt || !config.hash || !code) return false;
  const got = await hashCode(code, config.salt);
  let diff = got.length ^ config.hash.length;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ (config.hash.charCodeAt(i) || 0);
  return diff === 0;
}
export { hashCode, verifyCode };
