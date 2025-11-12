
# SatMap Action (Vercel)

Esta Action devuelve un PNG de mapa satélite (Google Static Maps) con un pin en el punto y rótulos (municipio, calle si existe y hasta 3 etiquetas).

## Despliegue rápido en Vercel (paso a paso)

1. Crea una cuenta gratuita en https://vercel.com e inicia sesión.
2. Crea un nuevo repositorio en GitHub (por ejemplo, `satmap-action`) y sube todos los archivos de este ZIP a la raíz del repo:
   - `package.json`
   - `vercel.json`
   - `api/render.js`
   - `openapi.yaml`
3. En Vercel, pulsa **Add New → Project** y **Importa** tu repo `satmap-action`.
4. En **Environment Variables** añade:
   - **Name:** `GOOGLE_STATIC_KEY`
   - **Value:** tu clave de Google Static Maps API
   - **Environment:** `Production` (y `Preview` si quieres)
5. Pulsa **Deploy** y espera a que termine.
6. Abre tu URL de producción y verifica que `https://TU-PROYECTO.vercel.app/openapi.yaml` carga el YAML.

## Usar en GPT Builder (Actions)

1. En el GPT Builder → **Actions → Crear nueva acción**.
2. Elige **Importar desde URL** e introduce: `https://TU-PROYECTO.vercel.app/openapi.yaml`
3. Autenticación: **Ninguno**. Guarda.
4. En las **Instrucciones** de tu GPT, indica llamar a `renderSatMap` con `lat`, `lon`, `zoom` (17) y `labels`.

¡Listo! El GPT podrá adjuntar el PNG en sus respuestas.
