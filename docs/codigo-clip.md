# Código Clip

Un juego de inducción para nuevos ingresos. Funciona como Lobo o Among Us: cada persona recibe en su celular una carta con un personaje secreto y 5 **rasgos** tomados de la presentación (frases de su personaje, no preguntas). Durante la sesión platica con los demás para reconocer sus rasgos en otras personas, encontrar a sus aliados y descubrir a los phishing.

El juego es un medio, no la meta. Lo que se busca es que cada quien salga conociendo el negocio, la cultura, Talent Performance y por qué importa la seguridad. No hay ganador: cada quien tiene una barra de vida que empieza en 100.

## Cómo se abre

- **Host:** https://simulador-comunicacion.vercel.app/#/codigo (o desde el menú de inicio, tarjeta "Código Clip"). Al confirmar se abre el **control del host**, que es solo para ti (roles, votos, respuestas).
- **Pantalla para proyectar o compartir en Meet:** en el control, botón **"📺 Abrir pantalla para proyectar"**. Abre `#/codigo/pantalla/CODIGO` en otra ventana: el QR como carta de juego, solo la sección actual y el ranking con nombres y barras de vida. Comparte **solo esa ventana**.
- **Participantes:** escanean el QR del host. Si no pueden, escriben la liga que aparece bajo el QR.
- **Probar sin red, en un solo navegador:** agrega `?local=1` (por ejemplo `…/?local=1#/codigo`) y abre los "celulares" en otras pestañas. Es solo para probar: no sirve para una sesión real.

### Una sola vez: la base de datos

Código Clip usa el mismo Supabase que el simulador, pero con tablas propias. En Supabase → **SQL Editor** → **New query**, pega y corre, en orden:

1. [`supabase/migrations/002_codigo_clip.sql`](../supabase/migrations/002_codigo_clip.sql) (ya la corriste).
2. [`supabase/migrations/003_codigo_clip_v2.sql`](../supabase/migrations/003_codigo_clip_v2.sql): barras de vida, mínimo 3 jugadores y la pantalla pública.

Se pueden correr más de una vez sin problema.

## Cómo se usa la sesión

1. **Registro.** El host escribe cuántas personas hay (**mínimo 3**). El sistema calcula los infiltrados (de 3 a 9 → 1, 10–15 → 2, 16–20 → 3, 21 o más → 4) y sugiere el resto del reparto. El host puede ajustarlo con +/−; el botón de confirmar solo se activa cuando el total coincide.
2. **Reparto.** Al confirmar se baraja y se reparten los roles, una sola vez, antes de la primera plática. Quien llega después de completar el número recibe un rol que ya existe, nunca phishing.
3. **Celular.** Cada quien escanea el QR y ve una cinemática corta ("Bienvenido a Clip… Gracias por elegirnos") con el botón **Iniciar**, luego **Cómo se juega** (5 tarjetitas) y escribe su nombre. Recibe su carta boca abajo y la voltea: número público ("Jugador 7"), personaje, grupo, descripción y 5 rasgos. El botón **?** vuelve a abrir las instrucciones.
   - Los phishing reciben rasgos señuelo: dos parecidos a los de los grupos y tres que contradicen al grupo que imitan.
   - Si alguien cierra la pantalla, vuelve a escanear, escribe el mismo nombre y confirma "Sí, recuperar mi personaje".
4. **Secciones.** El host avanza la agenda: ¿Quiénes somos? → Firma de contrato → Promesa Clip → Comida → Configuración de equipos → Talent Performance → Charla de Ciberseguridad. La pantalla proyectada solo muestra la sección actual. Al terminar cada sección puede abrir la **ronda de preguntas**.
5. **Pregunta rescate.** En las secciones que tienen rescate (Negocio, Cultura, Seguridad y TP), cada jugador puede pedir una vez su pregunta y responderla para conservar su puntaje.
   - La respuesta aparece en el host, en la pestaña Rescates, junto a la respuesta esperada y su diapositiva. El host la marca ✓ o ✗.
   - Firma de contrato, Comida y Configuración de equipos no tienen rescate.
6. **Votación.** Se puede abrir desde la sección 2, es decir, después de la primera plática. Cada quien vota una vez por ronda. En la pestaña Votos, el host ve quién votó por quién, con nombres reales, y la cuenta de votos.
7. **Auditor.** Al cerrar la votación, el host nombra auditor al más votado (si hay empate, decide el host). El auditor no sale: sigue jugando y recibe su propia pregunta rescate. Todos ven si era phishing o no.
8. **Venta.** Con la venta abierta, los vendedores (de Clip o de Mi Clip) buscan a un merchant para convencerlo. El merchant marca en su celular los criterios que se cumplieron y decide si quedó convencido. Los criterios se ven en el host, en la pestaña Venta.
9. **Barras de vida.** Empiezan en 100 y se ven en el ranking de la pantalla proyectada y en cada celular:
   - −10 por cada voto recibido como sospechoso.
   - +15 por rescate correcto (sin pasar de 100), −5 por rescate incorrecto.

   El host puede apagarlas; apagadas, la vida no cambia.
10. **Cierre.** "Cerrar sesión y borrar datos" elimina nombres, roles, votos, rescates y ventas. No hay exportación.

## Datos personales

- Solo se pide el nombre que escribe cada jugador. Sirve para anclar su personaje y que pueda volver a entrar.
- Los demás celulares solo ven números ("Jugador 7"). El voto guarda identificadores internos, no nombres.
- La pantalla proyectada muestra el nombre y la vida de cada quien (así lo pidió la usuaria), pero nunca roles, votos ni respuestas. Eso solo está en el control del host, y solo mientras la sesión está abierta. La base de datos no deja leer las tablas desde el navegador: todo pasa por funciones que piden la llave del host o el token del jugador.
- Al cerrar la sesión se borra todo.

## Contenido y estado de validación

Todo el contenido está en [`app/src/codigo/content.ts`](../app/src/codigo/content.ts).

- Cada pista y cada rescate lleva la diapositiva de donde sale:
  - `OB p.N`: presentación OB, octubre 2026.
  - `TP p.N`: presentación de Talent Performance, Goal Setting y CRL Continuo.
- Ningún dato está validado como oficial. Cada uno tiene una etiqueta:
  - **Propuesta · validar:** el dato sale de la presentación, pero falta que alguien lo confirme.
  - **Diseño del juego:** texto que redacté para el juego; no está en la presentación. Por ejemplo, las pistas señuelo, las 2 pistas extra de "persona normal", las preguntas de auditor y los criterios de venta.
  - **Pendiente de fuente:** la presentación no lo responde.

El host ve todo esto en la pestaña **Banco de respuestas**.

### Pendientes de validar

| Dato | Qué pasa |
| --- | --- |
| "¿Cuánto tarda en llegarme el dinero?" (pista del Grupo Comercio) | No tiene fuente. El md cita diap. 27–28, pero en el OB esas diapositivas hablan del efectivo y del cobro con el celular. |
| Clip Plus, 2017 | Así aparece en OB p.14. La línea de tiempo de p.16 lo pone más cerca de 2018. |
| "Ego off, Impact on" | Está en el Perfil Clipper / Leadership Framework (OB p.62–63), no en la lista de valores (OB p.57). El rescate dice "Completa el valor". |
| TPV | Solo aparece como "TPV growth 30% YoY" (OB p.42); no se define. |
| "¿Qué pasa si pago sin tarjeta?" | Es ambiguo: puede ser el pago sin tarjeta presente (OB p.15) o el celular como terminal (OB p.28). |
| "Haz rendir más tu dinero" y 24/7 Customer Happiness | La presentación los nombra pero no los explica (OB p.30–31). |
| 42 mil comercios activos, 399k instalaciones | Habría que confirmar si las cifras siguen vigentes. |
| #MetasGanadoras: 3–6 metas, peso 5–40%, KPI, CRL | Confirmados en TP p.12–13 y p.18. Falta que Talent Performance valide la redacción. |
| PCI DSS y las 5 acciones de seguridad | OB p.72 y p.74. Falta que Seguridad valide la redacción. |

## Decisiones técnicas abiertas

- **Recuperar por nombre:** quien escriba el nombre de otra persona y confirme "soy yo" entra como ella. En sala es aceptable; si no lo es, se puede pedir también el número de jugador.
- **Sesiones sin cerrar:** si el host nunca cierra, los datos quedan en Supabase. Opciones: un borrado programado (pg_cron, por ejemplo después de 24 h) o borrarlas a mano.
- **Revelar el rol del auditor:** hoy todos ven si el votado era phishing. Se puede volver opcional.
- **Agenda:** está fija en el orden de México. Para Argentina habría que agregar un selector.
- **Formato:** el prototipo vive dentro de la app web, en Vercel, no en Storyline. Para usarlo desde Articulate, se inserta el host como objeto web, igual que el simulador.

## Cómo está hecho

| Archivo | Qué hace |
| --- | --- |
| `app/src/codigo/content.ts` | Personajes, pistas, rescates y criterios, con su referencia. |
| `app/src/codigo/roles.ts` | Tabla de infiltrados, reparto sugerido, baraja y conteo de votos. |
| `app/src/codigo/state.ts` | Las reglas: entrar, votar, rescatar, nombrar auditor, vender, cerrar. |
| `supabase/migrations/002_codigo_clip.sql` | Las mismas reglas en Supabase, con funciones protegidas por la llave del host o el token del jugador. |
| `app/src/codigo/transport/` | Supabase, o el backend del navegador con `?local=1`. |
| `app/src/screens/codigo/` | Registro, control del host, pantalla proyectada y celular. |
| `supabase/migrations/003_codigo_clip_v2.sql` | Vida, mínimo 3 y la función pública `cc_board` para la pantalla proyectada. |

**Estilo:** las variables `--cc-*` de `app/src/index.css` están marcadas **PROVISIONAL**. Se apoyan en los tokens que ya usa la app; no hay logos.

**Pruebas:**
- `npm test`: reglas, reparto y contenido; también revisa que el SQL use las mismas secciones con rescate.
- `npm run e2e`: una sesión completa con 6 celulares.
