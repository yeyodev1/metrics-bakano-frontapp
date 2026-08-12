# Estrategia SEO y GEO — metrics.bakano.ec

## El objetivo no es el que parece

Esto no es un sitio comercial. Es el entorno privado de los clientes de Bakano:
tres páginas públicas y todo lo demás detrás del login. Intentar posicionarlo
para "agencia de marketing Ecuador" sería competir contra **mkt.bakano.ec**, que
es el sitio que sí tiene que vender, y repartir la autoridad entre dos dominios
del mismo grupo.

El objetivo real es más estrecho y más útil:

1. Que quien busca **"metrics bakano"**, "bakano plataforma", "entrar bakano"
   llegue aquí y entienda en un segundo que necesita ser cliente.
2. Que quien busca a Bakano para **contratarla** no se quede atascado en un
   login: que rebote a mkt.bakano.ec.
3. Que un asistente de IA que reciba "¿qué es metrics.bakano.ec?" pueda
   responderlo con datos de la propia página y no improvisando.
4. Que **nada privado** entre en un índice.

## Lo que ya está aplicado

### Nada privado se indexa

| Ruta | robots | Canónico |
|---|---|---|
| `/` | index, follow | `/` |
| `/login` | index, follow | `/login` |
| `/recuperar-contrasena` | index, follow | `/recuperar-contrasena` |
| `/restablecer-contrasena/:token` | **noindex, nofollow** | `/` |
| `/app/**`, `/editor/**` | **noindex, nofollow** | `/` |

Los enlaces de restablecer llevan un **token de un solo uso en la URL**. Que un
rastreador los visitara no sería un problema de posicionamiento sino de
seguridad: quemaría el enlace de alguien, o peor. Están bloqueados por dos vías,
`robots.txt` y la etiqueta `robots` que se aplica en cada navegación
(`src/router/seo.ts`), porque las dos fallan de maneras distintas.

Todo lo que exige sesión hereda `noindex` automáticamente: no hay que acordarse
de marcarlo ruta por ruta.

### El mensaje es el mismo en todas partes

"Plataforma de clientes de Bakano" aparece, con esas palabras, en:

- el `<title>` de las cuatro páginas públicas y en la descripción de cada una,
- el `h1` del home: *"El entorno de trabajo de los clientes de Bakano"*,
- el subtítulo, en negrita: *"El acceso es solo para clientes de Bakano"*,
- el bloque de cierre del home y el pie del login,
- los datos estructurados (`WebApplication.audience` = "Clientes de Bakano",
  `isAccessibleForFree: false`).

Repetirlo no es relleno: es la señal que evita que Google trate este dominio
como un segundo sitio comercial, y lo que hace que un asistente responda "es la
plataforma de clientes" en vez de "es una herramienta de analítica".

### Datos estructurados (lo que más pesa para GEO)

En `index.html`, un `@graph` con tres nodos enlazados:

- **Organization** — Bakano, con `@id` en mkt.bakano.ec, dirección en Guayaquil
  y `areaServed: Ecuador`. El `@id` apunta al sitio comercial a propósito: la
  entidad "Bakano" vive allá; este dominio solo la referencia.
- **WebSite** — `alternateName: "Plataforma de clientes de Bakano"`.
- **WebApplication** — qué hace, para quién, y `provider` apuntando a la
  organización.

En el home, además, **FAQPage** con cinco preguntas reales. Es la pieza con más
retorno para motores generativos: son las respuestas que un asistente puede
citar tal cual. Están visibles en la página, no escondidas en el marcado —
publicar datos estructurados que no correspondan a contenido visible es motivo
de penalización.

### Señales locales (la parte "geo")

`lang="es-EC"`, `og:locale=es_EC`, `geo.region=EC-G`, `geo.placename=Guayaquil`,
y en el marcado la dirección y el `areaServed`. Este dominio no compite por
búsquedas locales — pero refuerza la entidad "Bakano, Guayaquil" que sí le
sirve a mkt.bakano.ec.

### Enlace al sitio comercial

El botón "Quiero ser cliente de Bakano" y el enlace del login apuntan a
mkt.bakano.ec **sin `nofollow`**, a propósito: es enlace entre dominios del
mismo grupo y la autoridad debe fluir hacia donde se vende.

### Otros archivos

- `public/robots.txt` — permite lo público, bloquea lo privado, declara el sitemap.
- `public/sitemap.xml` — solo las tres URLs públicas.
- `public/og-metrics.jpg` — 1200×630, foto real del equipo, para cuando el
  enlace se comparte por WhatsApp.

## Lo que falta y no depende del código

1. **Google Search Console**: dar de alta el dominio y enviar el sitemap. Sin
   esto, lo anterior tarda semanas en surtir efecto.
2. **Enlace desde mkt.bakano.ec**: un "Acceso clientes" en su cabecera o pie
   apuntando aquí. Es la señal más fuerte para asociar los dos dominios, y hoy
   no existe.
3. **Ficha de Google Business** de Bakano: que el sitio web sea mkt.bakano.ec,
   no este. Si apunta aquí, los clientes potenciales aterrizan en un login.
4. **Revisar que no haya índice viejo**: buscar `site:metrics.bakano.ec` en
   Google. Si aparecen rutas `/app/...` de antes de este cambio, pedir su
   retiro desde Search Console; `robots.txt` evita nuevas visitas pero no borra
   lo ya indexado.

## Lo que deliberadamente NO se hizo

- **Prerender / SSR.** Google ejecuta JavaScript y las tres páginas públicas ya
  traen su `<head>` correcto desde `index.html`. Los rastreadores de algunos
  asistentes de IA no ejecutan JS, y para ellos el HTML inicial ya contiene el
  título, la descripción y el `@graph`. Lo único que sí depende de JS es el
  FAQPage; si más adelante importa que lo vean todos, la solución es moverlo al
  `index.html`, no montar SSR para un portal de login.
- **Blog o contenido de marca aquí.** Ese contenido pertenece a mkt.bakano.ec.
  Publicarlo en este dominio dividiría la autoridad entre los dos.
