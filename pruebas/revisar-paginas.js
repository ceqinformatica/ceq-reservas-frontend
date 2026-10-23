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
    // AUD-16: ninguna página se puede mostrar dentro de otro sitio
    const todas = (conf.headers || []).find(h => h.source === '/(.*)');
    if (todas && todas.headers.some(h => h.key === 'Content-Security-Policy' && /frame-ancestors 'self'/.test(h.value))) ok("vercel.json: todas las páginas llevan frame-ancestors 'self'");
    else falla("vercel.json: falta frame-ancestors 'self' para todas las páginas");
  } catch (e) { falla('vercel.json no es JSON válido: ' + e.message); }
}

// AUD-18: el menú de Avanzado (MENU_AVANZADO en admin.html) arma cada sección buscando el texto
// EXACTO de sus títulos <h3>. Si se cambia un título y no el menú (o al revés), la sección queda
// suelta al final o no aparece: se revisa que coincidan.
const archivoAdmin = path.join(raiz, 'admin.html');
if (fs.existsSync(archivoAdmin)) {
  const html = fs.readFileSync(archivoAdmin, 'utf8');
  const bloque = html.match(/const MENU_AVANZADO = (\[[\s\S]*?\n {4}\]);/);
  const inicio = html.indexOf('id="tab-avanzado"');
  const fin = html.indexOf('<footer', inicio);
  if (!bloque || inicio < 0 || fin < 0) {
    falla('admin.html: no se encontró MENU_AVANZADO o la pestaña Avanzado');
  } else {
    const menu = vm.runInNewContext(bloque[1]);
    const enMenu = menu.flatMap(([, opciones]) => opciones.flatMap(o => o[3]));
    const titulos = [...html.slice(inicio, fin).matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const sinTitulo = enMenu.filter(t => !titulos.includes(t));
    const sinMenu = titulos.filter(t => !enMenu.includes(t));
    const claves = menu.flatMap(([, opciones]) => opciones.map(o => o[0]));
    if (sinTitulo.length) falla(`admin.html: el menú de Avanzado busca títulos que no existen: ${sinTitulo.join(', ')}`);
    else ok(`admin.html: los ${enMenu.length} títulos del menú de Avanzado existen`);
    if (sinMenu.length) falla(`admin.html: secciones de Avanzado que no están en el menú: ${sinMenu.join(', ')}`);
    else ok(`admin.html: las ${titulos.length} secciones de Avanzado están en el menú`);
    if (new Set(claves).size !== claves.length) falla('admin.html: hay claves repetidas en el menú de Avanzado');
    else ok(`admin.html: las ${claves.length} opciones del menú tienen claves distintas`);
  }
}

console.log(`\n${revisadas - fallas}/${revisadas} pruebas correctas`);
process.exit(fallas ? 1 : 0);
