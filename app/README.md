# Simulador de comunicación escrita — el juego

## Correrlo

```bash
npm install
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Typecheck y build a `dist/` |
| `npm test` | Motor de evaluación y casos (Vitest) |
| `npm run e2e` | Una sesión completa: host + 3 celulares (Playwright) |

Para conectarte a Supabase en local crea `app/.env.local` con:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Sin esas variables (o con `?local=1` en la URL) se usa el modo local: abre el
host en una pestaña y los "celulares" en otras del mismo navegador.
`?fast=1` quita la pausa de "escribiendo…"; los tests e2e usan ambas.

## Rutas

| URL | Pantalla |
| --- | --- |
| `#/` | Host: elegir caso y crear sesión |
| `#/host/K7P2Q` | Host: sala con QR → dashboard en vivo → resultados |
| `#/jugar/K7P2Q` | Participante (a donde lleva el QR) |
| `#/jugar` | Participante sin QR: escribe el código |

## Cómo se juega

1. El host elige **un** caso y crea la sesión; proyecta el QR.
2. Cada participante entra con su nickname y espera. Todos empiezan con **100 puntos** en verde.
3. El host inicia: arranca el cronómetro y todos reciben el mismo mensaje inicial.
4. Cada quien escribe libremente. El simulador analiza el mensaje y el
   interlocutor reacciona según la rama del caso (escala / poco claro / efectivo).
5. La conversación termina al lograr un **acuerdo concreto**, al agotar los
   mensajes o al acabarse el tiempo.
6. Resultados: ranking, estrategias que funcionaron (con citas reales), errores
   frecuentes, "qué observar" y aprendizajes. Tocando a cada persona se ve su
   conversación con lo detectado en cada mensaje.

### Reglas de puntuación

- **Barra de comunicación** (0–100): cada mensaje se califica con los 5 criterios
  (claridad 25%, empatía y tono 25%, contexto 20%, asertividad 15%, acuerdos 15%)
  y mueve la barra. Un mensaje que escala resta más.
- **Color**: verde → amarillo con la primera fricción o confusión; rojo si
  vuelve a escalar o la barra baja de 55. **Nunca regresa a verde** (ni de rojo a
  amarillo), pero desde amarillo todavía se puede cerrar un acuerdo.
- **Misión**: lograr el acuerdo que pide el caso (p. ej. en el caso 1: entender
  qué pasa + qué se entrega + para cuándo).
- **Puntaje final** = 70% barra + 30 puntos si se cumplió la misión. Conservar los
  100 puntos sin resolver la situación no gana.

## Cómo está hecho

```
src/
  engine/signals.ts       Diccionarios: texto libre → señales (empatía, culpa, fecha…)
  engine/score.ts         Señales → 5 criterios ponderados → puntos
  engine/conversation.ts  Conversación pura por participante: ramas, color, misión
  engine/analysis.ts      Ranking, estrategias y errores del grupo
  cases/                  Los 3 casos como datos (contexto, reglas, reacciones)
  realtime/               Supabase o modo local, misma interfaz
  screens/host/           Crear sesión, sala con QR, dashboard, resultados
  screens/player/         Unirse, espera, chat, resultado personal
```

**Cada celular corre su propia conversación** con el mismo motor determinista y
publica su estado en Supabase; el host solo lee. Si el host recarga la página no
se pierde nada, y un celular que recarga retoma donde iba.

**Evaluación por reglas.** En esta primera versión los mensajes se analizan con
palabras clave (en español, sin importar acentos ni mayúsculas) y las reacciones
del interlocutor están predefinidas. Para afinar cómo se detecta algo, edita
`engine/signals.ts` y agrega una frase de ejemplo a
`engine/conversation.test.ts`. Más adelante se puede sustituir `analyze()` por
una evaluación con IA sin tocar las pantallas.

### Estilo visual

El look sigue el **Clip Design System** (sin logos): Poppins self-hosted en
`src/fonts/`, naranja `#FC4C02` y el degradado de marca, tarjetas blancas de 24px
con un riel de degradado de 2px arriba, botones píldora con degradado que se
elevan con brillo naranja, barra superior (HUD) con degradado y paneles oscuros
con textura de puntos para las cifras. Los tokens están en `src/index.css`.

### Editar un caso

Cada archivo de `src/cases/` define: contexto, objetivo, mensaje inicial,
turnos y tiempo; `categorize` (qué hace que un mensaje escale, sea poco claro o
sea efectivo); las piezas del acuerdo y lo que dice el interlocutor mientras
faltan; y todas sus reacciones. `npm test` verifica que cada caso esté completo.
