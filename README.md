# Simulador de comunicación escrita

Una competencia grupal en vivo para practicar cómo comunicar situaciones
difíciles del trabajo por escrito. El host elige un caso y proyecta un código QR;
cada participante entra desde su celular y resuelve **exactamente el mismo
escenario**, al mismo tiempo y con las mismas reglas. El host ve en vivo una
barra por persona y, al final, el ranking, las estrategias que funcionaron y los
errores frecuentes.

```
app/                       El juego. React + Vite + TypeScript, sitio estático.
supabase/migrations/       Base de datos y tiempo real (Supabase).
```

Cómo correrlo, cómo funciona y cómo editar los casos: [`app/README.md`](app/README.md).

**Direcciones** (una vez que el repositorio se llame `demo`):

| Para | URL |
| --- | --- |
| Host (proyectar) | `https://dmonica90.github.io/demo/` |
| Participantes | las abre el QR (`…/demo/#/jugar/CODIGO`) |
| Laboratorio del motor | `https://dmonica90.github.io/demo/#/laboratorio` |

> Al renombrar el repositorio, GitHub redirige el código pero **no** la página:
> la dirección anterior (`…/Shield_Defense/`) deja de funcionar. Después de
> renombrar, vuelve a publicar con **Actions → Test and deploy → Run workflow**.

## Usarlo en Articulate

El curso solo necesita mostrar la **pantalla del host**; los participantes
juegan en su celular con el QR.

- **Rise 360:** agrega un bloque **Multimedia → Embed** (o *Code*), pega
  `https://dmonica90.github.io/demo/` y dale una altura de unos 800 px.
- **Storyline:** **Insert → Web Object**, pega la misma dirección. Para
  proyectar, elige *Open in a new browser window*: el QR y el dashboard se ven
  mejor a pantalla completa. *Display in slide* también funciona.
- El QR siempre apunta a la página del juego, no a la del LMS, así que los
  celulares entran directo.
- Se necesita internet (también dentro de Workday u otro LMS): el juego vive en
  GitHub Pages y la sesión en Supabase.

## Puesta en marcha (una sola vez, ~5 minutos)

El sitio es estático (GitHub Pages). Para que los celulares y la pantalla del
host se hablen en tiempo real usamos **Supabase** (plan gratuito).

1. Crea un proyecto en [supabase.com](https://supabase.com) (región cercana, cualquier contraseña).
2. En el proyecto: **SQL Editor → New query**, pega todo
   [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) y presiona **Run**.
3. En **Project Settings → API Keys** copia el **Project URL** y la
   **Publishable key** (`sb_publishable_…`) y ponlos en
   [`app/src/config.ts`](app/src/config.ts). Son públicos por diseño: viajan en
   la página; la seguridad la dan las reglas de la base de datos. **Nunca** pongas
   la *Secret key* (`sb_secret_…`) en el repositorio.
5. **Settings → Pages → Source: GitHub Actions**. Cada push a `main` publica en
   `https://dmonica90.github.io/Shield_Defense/`.

## Cómo llega el QR al celular

- El host abre el sitio, elige un caso y pulsa **Crear sesión**: se genera un
  código de 5 caracteres (p. ej. `K7P2Q`).
- El QR apunta a `https://dmonica90.github.io/Shield_Defense/#/jugar/K7P2Q`. La
  ruta va después de `#` para que GitHub Pages siempre sirva la misma página.
- El celular abre esa dirección, pide un nickname y aparece en la sala del host.
  Debajo del QR también se muestran el enlace y el código, para quien prefiera
  escribirlo.
- Los celulares solo necesitan internet (datos o WiFi); no tienen que estar en
  la misma red que la computadora del host.

Sin Supabase configurado el sitio funciona en **modo local**: solo pueden
unirse otras pestañas del mismo navegador. Sirve para probar a solas.
