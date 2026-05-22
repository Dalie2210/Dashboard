# Be Welly · Dashboard del Agente de IA

## Propósito
Dashboard web en tiempo real para monitorear el agente de IA de Be Welly.
Los datos provienen de la vista PostgreSQL `vista_dashboard_agente` en Neon.
El dashboard se actualiza automáticamente cada 30 segundos y permite filtrar por rango de fechas.

## Tech Stack
| Tecnología | Rol |
|---|---|
| Next.js 16 (App Router) | Framework principal, API routes como proxy de BD |
| React 19 + TypeScript | UI y tipado |
| Tailwind CSS v4 | Estilos, diseño responsivo dark-mode |
| Recharts | Gráficos (donut, barras apiladas) |
| SWR | Data fetching, polling automático 30s |
| `@neondatabase/serverless` | Cliente PostgreSQL para Neon |
| `react-day-picker` v9 | Selector de rango de fechas |

## Arrancar localmente
```bash
npm install
# Crea .env.local con tu DATABASE_URL (ver .env.example)
npm run dev          # http://localhost:3000
npm run build        # verificar que compile sin errores
```

## Variable de entorno requerida
Solo se necesita **una** variable en `.env.local`:
```
DATABASE_URL=postgresql://user:pass@host-pooler.region.aws.neon.tech/db?sslmode=require
```
Obtenerla en: Neon Console → proyecto → Connection Details → activar "Pooled connection".
**NUNCA** usar prefijo `NEXT_PUBLIC_*` — la BD solo es accesible desde el servidor.

## Estructura de la base de datos
**Vista:** `vista_dashboard_agente`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Identificador único |
| `session_id` | VARCHAR(255) | ID de la conversación |
| `rol` | TEXT | `'ai'` o `'human'` |
| `contenido` | TEXT | Contenido del mensaje |
| `fecha` | TIMESTAMP WITH TIME ZONE | Fecha y hora del mensaje |

Todas las queries filtran por `fecha >= $1 AND fecha < $2` para respetar el filtro de fechas.

## Archivos clave
```
lib/db.ts           — Cliente Neon singleton (solo servidor)
lib/queries.ts      — Todas las queries SQL con tipos de retorno
lib/types.ts        — Interfaces TypeScript compartidas
lib/utils.ts        — Formatters de fecha, colores de urgencia

app/api/dashboard/
  metrics/route.ts          — GET KPIs + distribución de roles
  last-interaction/route.ts — GET último mensaje por rol
  sessions/route.ts         — GET datos por sesión para gráfico de barras

hooks/useDateFilter.ts         — Estado del filtro de fechas (from/to)
hooks/useDashboardMetrics.ts   — Hooks SWR para los 3 endpoints

components/dashboard/
  DashboardClient.tsx       — Componente raíz "use client", orquesta todo
  DateRangeFilter.tsx       — Picker + presets (7d, 30d, mes)
  StatCard.tsx              — Tarjeta KPI genérica
  RoleDistributionChart.tsx — Donut chart (ai vs human)
  MessagesPerSessionChart.tsx — Bar chart apilado por sesión
  LastInteractionCard.tsx   — Tiempo desde último mensaje por rol
  RefreshIndicator.tsx      — Indicador de actualización en vivo
```

## API Routes
| Endpoint | Parámetros | Retorna |
|---|---|---|
| `GET /api/dashboard/metrics` | `?from=&to=` | avgMessagesPerSession, totalMessages, totalSessions, roleCounts |
| `GET /api/dashboard/last-interaction` | `?from=&to=` | lastAiMessage, lastHumanMessage, aiMinutesAgo, humanMinutesAgo |
| `GET /api/dashboard/sessions` | `?from=&to=` | sessions[] con messageCount, aiCount, humanCount |

Parámetros `from` y `to` en formato `YYYY-MM-DD`. Todos los endpoints validan las fechas y retornan `{ error: string }` con status 400/500 en caso de fallo.

## Métricas del dashboard
1. **Mensajes totales** — COUNT de mensajes en el período
2. **Sesiones únicas** — COUNT DISTINCT de session_id
3. **Promedio mensajes/sesión** — total_messages / total_sessions
4. **Distribución de roles** — % de mensajes de IA vs Humano (donut chart)
5. **Mensajes por sesión** — bar chart apilado por sesión (máx 50 sesiones)
6. **Última interacción** — tiempo transcurrido desde el último mensaje de cada rol

## Convenciones importantes
- **Server Components** no hacen fetching — solo renderizan layout y pasan props
- **Toda la data** se fetcha en hooks SWR desde componentes "use client"
- **Los charts** se cargan con `next/dynamic + { ssr: false }` para evitar errores de hidratación (Recharts usa APIs del DOM)
- **Nunca importar** `lib/db.ts` en componentes cliente — expone credenciales
- **Cache key de SWR** incluye `[url, from, to]` — cambiar fechas dispara re-fetch automático
- **Colores:** Azul (#3b82f6) para IA, Ámbar (#f59e0b) para Humano
- **Urgencia LastInteractionCard:** verde <5 min, amarillo 5–30 min, rojo >30 min

## Agregar una nueva métrica
1. Agregar query SQL en `lib/queries.ts` con tipo de retorno en `lib/types.ts`
2. Agregar o extender un API route en `app/api/dashboard/`
3. Agregar hook SWR en `hooks/useDashboardMetrics.ts`
4. Crear componente en `components/dashboard/`
5. Agregar al grid en `components/dashboard/DashboardClient.tsx`
6. Correr `npm run build` para verificar sin errores de tipos
