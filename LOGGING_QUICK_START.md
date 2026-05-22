# Guía Rápida: Sistema de Logs

## ✅ Lo que está implementado

Tu dashboard ahora tiene **logging profesional y profundo** que captura:

- 📊 **Todas las queries a BD** con duración en ms
- 🔌 **Conexiones a base de datos** y errores
- 🌐 **Requests API** con parámetros y respuestas
- ⚠️ **Todos los errores** con stack traces
- 🎯 **Contexto detallado** para debugging

## 📁 Dónde están los logs

Durante desarrollo, se guardan en:
```
logs/
├── app-2026-05-22.log      (todos los logs)
└── error-2026-05-22.log    (solo errores)
```

Los logs se rotan diariamente y se retienen por 7 días.

## 🔍 Cómo ver los logs

### PowerShell (recomendado)

Ver logs en tiempo real:
```powershell
Get-Content logs/app-*.log -Wait
```

Ver solo errores:
```powershell
Get-Content logs/error-*.log -Wait
```

Ver últimas 50 líneas:
```powershell
Get-Content logs/app-*.log -Tail 50
```

### Explorador de archivos

1. Abre `logs/` en el explorador
2. Abre el archivo `.log` con cualquier editor de texto
3. Busca (Ctrl+F) la fecha/hora o `error` para encontrar problemas

## 📋 Qué contienen los logs

Cada log tiene:
- **timestamp**: Fecha y hora exacta
- **level**: debug, info, warn, error
- **message**: Descripción de lo que pasó
- **module**: Dónde se originó (QueryLogger, Database, etc.)
- **contexto**: Detalles adicionales (duración, parámetros, etc.)

### Ejemplo: Query exitosa
```
{
  "timestamp": "2026-05-22 14:32:45",
  "level": "info",
  "message": "Query completed",
  "name": "getMetrics",
  "durationMs": 245,
  "module": "QueryLogger"
}
```

### Ejemplo: Error de query
```
{
  "timestamp": "2026-05-22 14:35:12",
  "level": "error",
  "message": "Query failed",
  "name": "getMetrics",
  "durationMs": 5000,
  "error": "Connection timeout",
  "stack": "Error: Connection timeout at ..."
}
```

## 🎯 Casos de uso común

### "Mi dashboard está lento, ¿cuál es la query lenta?"

1. Abre PowerShell
2. Ejecuta: `Get-Content logs/app-*.log -Wait`
3. Carga el dashboard
4. Busca en los logs: `"durationMs": [número grande]`
5. El log te dirá qué query tardó mucho

**Ejemplo:**
```
Query completed: getMetrics, 3500ms ← ¡LENTA!
Query completed: getLastRoleBySession, 120ms ← bien
Query completed: getSessionsTimeline, 200ms ← bien
```

### "¿Por qué me da error el dashboard?"

1. Abre `logs/error-YYYY-MM-DD.log`
2. Lee el error más reciente
3. El `stack` te dirá exactamente dónde falló y por qué

### "¿Qué parámetros se están enviando a las queries?"

Busca en el log el requestId y ves todos los detalles:
```
[1716384765123-abc123] Query started: from=2026-05-15, to=2026-05-22
[1716384765123-abc123] Database query executed in 245ms
[1716384765123-abc123] Response sent successfully
```

## 🔧 Cómo usar en código

### Loguear un evento
```typescript
import { getLogger } from '@/lib/logger';

const logger = getLogger('MiModulo');

logger.info('Usuario actualizado perfil', {
  userId: 123,
  campo: 'email',
  timestamp: new Date(),
});
```

### Loguear una query larga
```typescript
import { logQuery } from '@/lib/queryLogger';

const resultado = await logQuery('mi-query-especial', async () => {
  // Tu código aquí
  return data;
}, { parametro1: valor });
```

## 🚫 Lo que NO se loguea (por privacidad)

- ❌ Contraseñas
- ❌ Tokens JWT
- ❌ Datos sensibles de usuarios

Solo se loguean: IDs, timestamps, acciones, errores técnicos.

## ⚙️ Configuración

Los logs funcionan **automáticamente** sin configuración requerida.

**Ubicación:** `lib/logger.ts`

Si necesitas cambiar:
- Nivel de logs: edita `level: 'debug'` en logger.ts
- Ruta de logs: cambia `'logs'` por tu carpeta preferida
- Retención: cambia `maxFiles: '7d'` por otro período

## 📚 Ver documentación completa

Abre `LOGGING.md` para:
- Arquitectura completa del sistema
- Puntos de logging implementados
- Ejemplos de debugging avanzado
- Próximas mejoras planeadas
