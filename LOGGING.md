# Sistema de Logs - Be Welly Dashboard

## Descripción General

Sistema profesional de logging basado en **Winston** que captura eventos de toda la aplicación con múltiples niveles de severidad, timestamp y contexto detallado.

## Niveles de Severidad

- **debug**: Información detallada para debugging (iniciaciones, operaciones normales)
- **info**: Eventos normales y exitosos
- **warn**: Situaciones inesperadas pero recuperables
- **error**: Errores que requieren atención inmediata

## Ubicación de Logs

### En Desarrollo (NODE_ENV !== 'production')

Los logs se guardan en la carpeta **`logs/`** del proyecto:

```
logs/
├── app-2026-05-22.log          # Todos los logs del día
└── error-2026-05-22.log        # Solo errores del día
```

**Retención automática:** Los logs se mantienen por 7 días y se rotan diariamente.

### En Consola

Todos los logs también aparecen en la consola durante el desarrollo con colores para fácil lectura.

## Uso en el Código

### Logger Centralizado

```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('MiModulo');

logger.debug('Mensaje de debug', { contexto: 'valor' });
logger.info('Operación exitosa', { resultado: data });
logger.warn('Situación inesperada', { detalle: 'información' });
logger.error('Error crítico', { error: err.message, stack: err.stack });
```

### Logging de Queries

Las queries se envuelven automáticamente con timing y logging:

```typescript
import { logQuery } from '@/lib/queryLogger';

const result = await logQuery('nombreQuery', async () => {
  // Código que ejecuta la query
  return data;
}, { from, to }); // Contexto adicional
```

**Salida de ejemplo:**
```
[query-123] Starting query getMetrics
[query-123] Query completed: 245ms
```

## Puntos de Logging Implementados

### 1. API Routes (`app/api/dashboard/`)

Todos los endpoints loguean:
- ✅ Request entrante (fecha, parámetros, user-agent)
- ✅ Validación de parámetros (warn si fallan)
- ✅ Respuesta exitosa (info con métricas retornadas)
- ✅ Errores (error con stack trace)

**Endpoints:**
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/last-interaction`
- `GET /api/dashboard/sessions-timeline`

### 2. Database (`lib/db.ts`)

Loguea:
- ✅ Inicialización de conexión
- ✅ Creación del pool de conexiones
- ✅ Ejecución de queries dinámicas
- ✅ Errores de conexión
- ✅ Filas retornadas

### 3. Query Layer (`lib/queries.ts`)

Todas las funciones de queries (getMetrics, getLastRoleBySession, etc.):
- ✅ Inicio de ejecución
- ✅ Duración en milisegundos
- ✅ Contexto de parámetros (from, to)
- ✅ Errores con stack trace

### 4. Routes (API)

Cada route loguea:
- ✅ Método HTTP y ruta
- ✅ Parámetros query
- ✅ User-Agent del cliente
- ✅ Duración de respuesta (via query timing)

## Formato de Logs

### Consola (Desarrollo)

```
14:32:45 [info] Query completed
{
  "timestamp": "2026-05-22 14:32:45",
  "level": "info",
  "message": "Query completed",
  "name": getMetrics",
  "durationMs": 245,
  "module": "QueryLogger",
  "service": "be-welly-dashboard"
}
```

### Archivo JSON

```json
{
  "timestamp": "2026-05-22 14:32:45",
  "level": "info",
  "message": "Query completed",
  "module": "QueryLogger",
  "service": "be-welly-dashboard",
  "name": "getMetrics",
  "durationMs": 245
}
```

## Debugging con Logs

### Caso: Request lenta en `/api/dashboard/metrics`

1. **Abre** `logs/app-2026-05-22.log`
2. **Busca** el requestId (ej: `1716384765123-abc123xyz`)
3. **Sigue** la traza:
   ```
   [1716384765123-abc123xyz] Incoming request
   [1716384765123-abc123xyz] Starting query getMetrics
   [1716384765123-abc123xyz] Query completed: 3500ms (¡MUY LENTO!)
   [1716384765123-abc123xyz] Metrics retrieved successfully
   ```

### Caso: Error de base de datos

1. **Abre** `logs/error-2026-05-22.log`
2. **Lee** el error más reciente:
   ```json
   {
     "level": "error",
     "message": "Failed to fetch metrics",
     "error": "Connection timeout",
     "stack": "..."
   }
   ```

## Comando para Ver Logs en Tiempo Real

En PowerShell:
```powershell
Get-Content logs/app-*.log -Wait
```

En Bash/Terminal:
```bash
tail -f logs/app-*.log
```

## Variables de Entorno

No hay variables especiales requeridas — el logger funciona automáticamente basado en `NODE_ENV`.

Para cambiar comportamiento en el futuro:
- `LOG_LEVEL=debug|info|warn|error` (si se implementa)
- `LOG_DIR=./custom-logs` (si se personaliza)

## Mantenimiento

- **Limpieza**: Los logs se limpian automáticamente después de 7 días
- **Rotación**: Nueva carpeta de logs cada día (fecha en el nombre)
- **.gitignore**: La carpeta `logs/` está excluida de git, nunca se commitea

## Próximas Mejoras Posibles

- [ ] Logging en componentes React (eventos de usuario)
- [ ] Logging en llamadas a Groq/Google AI APIs
- [ ] Integración con servicio externo de logs (LogTail, Datadog) para producción
- [ ] Dashboard de logs en la UI
- [ ] Alertas en Slack para errores críticos
- [ ] Tracking de performance por endpoint
