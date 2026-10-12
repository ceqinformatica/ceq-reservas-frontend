// Revisión automática de las páginas (la corre GitHub en cada cambio):
//  - que el JavaScript de cada página no tenga errores de escritura (si tuviera, la página no andaría),
//  - que vercel.json sea válido,
//  - que existan las páginas a las que apuntan los enlaces internos (terminos.html, privacidad.html, ...).
// Uso: node pruebas/revisar-paginas.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..');
const paginas = fs.readdirSync(raiz).filter(f => f.endsWith('.html'));
let fallas = 0, revisadas = 0;
const ok = texto => { revisadas++; console.log('OK    ' + texto); };
const falla = texto => { revisadas++; fallas++; console.log('FALLA ' + texto); };

for (const pagina of paginas) {
  const html = fs.readFileSync(path.join(raiz, pagina), 'utf8');
  // Scripts escritos dentro de la página (no los que vienen de afuera con src=)
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  scripts.forEach((codigo, i) => {
    try { new vm.Script(codigo, { filename: `${pagina} (script ${i + 1})` }); ok(`${pagina}: script ${i + 1} sin errores`); }
    catch (e) { falla(`${pagina}: script ${i + 1} -> ${e.message}`); }
  });
  // Enlaces a otras páginas del mismo sitio
  for (const [, destino] of html.matchAll(/href="([a-z0-9-]+\.html)(?:[?#][^"]*)?"/gi)) {
    if (fs.existsSync(path.join(raiz, destino))) ok(`${pagina}: el enlace a ${destino} existe`);
    else falla(`${pagina}: enlace a ${destino}, pero esa página no existe`);
  }
}

const vercel = path.join(raiz, 'vercel.json');
if (fs.existsSync(vercel)) {
  try {
    const conf = JSON.parse(fs.readFileSync(vercel, 'utf8'));
    const admin = (conf.headers || []).find(h => String(h.source).startsWith('/admin'));
    if (admin && admin.headers.some(h => h.key === 'X-Frame-Options')) ok('vercel.json válido y protege admin.html');
    else falla('vercel.json no tiene la protección de admin.html');
  } catch (e) { falla('vercel.json no es JSON válido: ' + e.message); }
}

console.log(`\n${revisadas - fallas}/${revisadas} pruebas correctas`);
process.exit(fallas ? 1 : 0);
