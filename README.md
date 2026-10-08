# Insurance Policy Frontend

[![CI](https://github.com/juanpa1601/insurance_policy_frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/juanpa1601/insurance_policy_frontend/actions/workflows/ci.yml)
![Coverage](https://img.shields.io/badge/coverage%20(l%C3%ADneas)-43%25-orange)

SPA para administrar clientes y pólizas de seguros. Consume la API REST de [insurance_policy_api](https://github.com/juanpa1601/insurance_policy_api).

## Tecnologías

- React 19 y TypeScript
- Vitest y Testing Library
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

Requisitos: Node.js 24 (la versión del CI) y la API corriendo en `http://localhost:3000` (ver su README).

```bash
npm install
npm run dev     # http://localhost:5173
```

Vite redirige `/api` a `http://localhost:3000`, así que no hace falta configurar CORS en desarrollo.

Pruebas (no necesitan la API; las llamadas HTTP se simulan con `vi.mock`):

```bash
npm test            # Vitest
npm run test:cov    # con reporte de cobertura en coverage/
```

## Calidad

Cada push y cada pull request ejecutan en [GitHub Actions](.github/workflows/ci.yml) lint sin warnings, typecheck (`tsc -b`), las pruebas con cobertura y el build de producción.

### Pruebas

| Nivel | Pruebas | Qué cubre | Archivo |
|---|---:|---|---|
| Componente | 5 | Formulario de cotización completo (React Hook Form + Zod + React Query): cliente requerido, Risk Score requerido, payload numérico enviado a la API y error de la API | `src/pages/CreatePolicyPage.test.tsx` |
| Componente | 11 | Modal de cambio de estado: opciones por estado alineadas con el backend, CANCELLED terminal, confirmar, cancelar, invalidación de caché y errores del backend | `src/components/ChangePolicyStatusModal.test.tsx` |
| Unitarias | 19 | Esquema Zod del formulario: requeridos por estrategia, rangos, conversión de strings a número y campos vacíos | `src/pages/createPolicy.schema.test.ts` |
| **Total** | **35** | | |

Cobertura de la última ejecución local (`npm run test:cov`): **43,05 %** de líneas, 43,15 % de sentencias y 49,64 % de ramas. Las pruebas se concentran en la lógica con reglas de negocio (el formulario de cotización y el modal de transiciones superan el 76 % de líneas); los listados y las páginas de clientes todavía no tienen pruebas. El badge de cobertura es estático y refleja esa medición.

### Bugs encontrados por las pruebas

- **Campos numéricos vacíos:** con `z.coerce.number()`, un `<input type="number">` vacío se convertía en `0`. RISK_BASED sin Risk Score se enviaba como `riskScore: 0`, y un año de lealtad vacío en un campo oculto bloqueaba una póliza STANDARD. Ahora un campo vacío cuenta como ausente y cada estrategia valida solo su propio dato.
- **Transición faltante:** el modal no ofrecía `QUOTED → CANCELLED`, aunque el backend la permite.
- **Build:** `npm run build` fallaba con 2 errores de tipos en `CreatePolicyPage.tsx`. Se corrigió tipando el formulario con la entrada y la salida del esquema Zod.

## Cómo usé IA

Trabajé con **Claude Code** como copiloto, revisando y ejecutando lo que proponía:

- **Edge cases:** propuso los casos límite del formulario (campos vacíos, límites 0/100 y de años, cambiar de estrategia con datos a medias) y los verificó ejecutando el esquema real. Así aparecieron los dos bugs de campos vacíos.
- **Pruebas primero:** las pruebas se escribieron con el comportamiento esperado y se ejecutaron contra el código anterior para confirmar que fallaban por el bug, antes de corregirlo.
- **Revisión de código:** detectó que el modal no estaba alineado con la máquina de estados del backend y propuso la corrección de tipos que desbloqueó el build.

Los conteos y la cobertura de este README salen de ejecuciones reales de la suite.

## Contexto

Frontend del reto integrador de pólizas de seguros, desarrollado junto con [insurance_policy_api](https://github.com/juanpa1601/insurance_policy_api).
