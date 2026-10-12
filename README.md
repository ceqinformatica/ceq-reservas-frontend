# Sistema de Reservas del CEQ: páginas

Páginas del sistema de reservas del Centro de Estudiantes de Química (CEQ-UNA), publicadas en **Vercel** como https://reservas.ceq-una.com.

| Archivo | Qué es |
|---|---|
| `index.html` | Página pública: calendario, formulario de reserva, lista de espera de los días llenos, cuenta regresiva de las aperturas programadas y "Reportar un problema". |
| `cancelar.html` | Cancelar una reserva con el código o con el enlace "Cancelar mi reserva" de los correos. |
| `admin.html` | Panel de administración (reservas, bloqueos, meses, prioridad, exportar a Excel y reportes). Con la contraseña del admin supremo aparece además la pestaña **Avanzado** (espacios, eliminar registros, actividad y seguridad). |
| `terminos.html`, `privacidad.html` | Términos y condiciones y Política de privacidad (enlazadas al pie de la página y debajo del botón de reservar). Si cambian las reglas (turnos, límites, plazos), actualizar también estos textos. |
| `vercel.json` | Cabeceras de seguridad que agrega Vercel: entre otras, impide que el panel de administración se pueda mostrar dentro de otra página. |
| `pruebas/revisar-paginas.js` | Revisión automática que GitHub corre sola con cada cambio (archivo `.github/workflows/revisar.yml`): que el JavaScript de las páginas no tenga errores, que no haya enlaces rotos entre páginas y que `vercel.json` sea válido. ✅ = todo bien; ❌ = mirar la pestaña **Actions**. |
| `logo-ceq.png`, `favicon.ico`, `favicon-192.png`, `apple-touch-icon.png` | Logo e íconos del sitio. |

Las páginas no guardan datos: todo lo piden al servidor en `https://api.ceq-una.com/api` (repo [`ceq-reservas`](https://github.com/ceqinformatica/ceq-reservas)).

**El manual de mantenimiento completo está en el repo del servidor:** https://github.com/ceqinformatica/ceq-reservas#readme

Al subir un cambio acá (GitHub → editar o **Add file → Upload files** → **Commit**), Vercel lo publica solo en uno o dos minutos.

> Este repositorio es público y todo lo que se sube también queda publicado en la web: nunca pongas acá contraseñas ni claves.
