# Insurance Policy Frontend

SPA para administrar clientes y pólizas de seguros. Consume la API REST de [insurance_policy_api](https://github.com/juanpa1601/insurance_policy_api).

## Tecnologías

- React 19 y TypeScript
- Vite
- Tailwind CSS v4
- TanStack Query (React Query) y Axios
- React Hook Form y Zod
- React Router 7

## Qué hace

- **Clientes:** listado, detalle con sus pólizas y formulario de creación validado con Zod.
- **Pólizas:** listado y formulario de emisión con ramo (`AUTO`, `LIFE`, `HOME`, `HEALTH`, `TRAVEL`), estrategia de tarificación (`STANDARD`, `RISK_BASED`, `LOYALTY`) y perfil de riesgo.
- **Cambio de estado:** un modal que solo ofrece las transiciones permitidas por la máquina de estados del backend (`QUOTED → ISSUED → ACTIVE ⇄ SUSPENDED`, y `CANCELLED` desde cualquier estado no final).
- Tras crear o modificar datos, invalida la caché de TanStack Query para refrescar los listados.

Rutas: `/customers`, `/customers/new`, `/customers/:id`, `/policies`, `/policies/new`.

## Cómo ejecutarlo

Requisitos: Node.js 20 o superior y la API corriendo en `http://localhost:3000` (ver su README).

```bash
npm install
npm run dev     # http://localhost:5173
```

Vite redirige `/api` a `http://localhost:3000`, así que no hace falta configurar CORS en desarrollo.

## Estado actual

- Probado localmente con `npm run dev`: la app carga y obtiene datos de la API a través del proxy.
- `npm run build` falla con 2 errores de tipos en `src/pages/CreatePolicyPage.tsx`, por la combinación de `z.coerce.number()` con el resolver de React Hook Form. Queda pendiente corregirlos.

## Contexto

Frontend del reto integrador de pólizas de seguros, desarrollado junto con [insurance_policy_api](https://github.com/juanpa1601/insurance_policy_api).
