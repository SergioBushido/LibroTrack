# LibroTrack - Documentación para Agentes AI

Este documento proporciona contexto sobre la aplicación **LibroTrack** para que cualquier agente AI pueda entender rápidamente el propósito, la tecnología y el estado actual del proyecto.

## 📌 Propósito de la App
LibroTrack es una biblioteca personal de lectura diseñada para gestionar y visualizar el historial de libros leídos. Se enfoca en un diseño editorial premium y en proporcionar estadísticas detalladas sobre los hábitos de lectura.

## 🛠 Stack Tecnológico
- **Core**: React Native 0.81 con Expo SDK 54 (TypeScript).
- **Navegación**: React Navigation (Bottom Tabs + Stack Navigators).
- **Persistencia**: AsyncStorage para almacenamiento local.
- **Gráficos**: `react-native-chart-kit` y `react-native-svg`.
- **Estilos**: Sistema de temas dinámicos (Día/Noche) centralizado en `src/constants/theme.ts` y gestionado por `ThemeContext.tsx`.
- **Iconos**: MaterialCommunityIcons (@expo/vector-icons).

## 🚀 Funcionalidades Implementadas

### 1. Gestión de Libros
- Listado completo con buscador y filtros por valoración o año.
- Detalle inmersivo de cada libro con notas, género, racha de lectura y cita favorita.
- CRUD completo (Añadir, Editar, Eliminar).

### 2. Estadísticas y Gamificación
- **Reto Lector Anual**: Progreso visual y predicción de cumplimiento.
- **Gráficos**: Evolución mensual de lecturas y distribución por valoración (Donut chart).
- **Récords**: Identificación del libro más rápido y más lento de leer.
- **Mood Tracking**: Frecuencia de estados de ánimo asociados a las lecturas.

### 3. Modo Día / Noche
- Implementación de un tema dinámico que cambia todos los colores de la app al instante.
- Persistencia de la preferencia del tema en AsyncStorage.

### 4. Importación Inteligente
- Sistema de importación desde notas móviles que parsea texto plano para extraer libros agrupados por meses.

### 5. Herramientas de Búsqueda
- Pantalla dedicada con enlaces rápidos a Google, Amazon, Goodreads, etc., para buscar información de libros.

## 📂 Estructura del Proyecto
- `src/components/`: Componentes UI reutilizables (tarjetas, gráficos, selectores).
- `src/screens/`: Pantallas principales de la aplicación.
- `src/services/`: Lógica de almacenamiento (`bookStorage.ts`) y cálculo de estadísticas (`statsService.ts`).
- `src/context/`: Contexto para la gestión del tema global.
- `src/utils/`: Utilidades para manejo de fechas, filtros y parsing de texto.
- `src/constants/`: Definición de la paleta de colores y tokens de diseño.

## 📍 Estado Actual
La aplicación es funcional y cuenta con su arquitectura base sólida. Se han corregido problemas de dependencias y está conectada a un repositorio en GitHub (`SergioBushido/LibroTrack`).

**Tareas de la siguiente fase:**
- [x] Copias de seguridad JSON locales (exportar y restaurar con validación).
- [x] Exportación CSV de la biblioteca (UTF-8 con BOM, RFC 4180 y protección ante fórmulas).
- [x] Mejoras y animaciones con Reanimated en la pantalla de detalle (parallax, cabecera fija, movimiento reducido y vista previa de portada).
- [x] Sistema de notificaciones locales para recordar el reto lector (frecuencia diaria/semanal, hora configurable, sincronización con progreso y aviso de prueba).
- [x] Sincronización en la nube para copias de seguridad (GitHub Gist privado con token cifrado en `expo-secure-store`, auto-descubrimiento y restauración validada).
- [x] Mejoras técnicas: `ErrorBoundary` global, ordenación personalizable de biblioteca persistida y tipado estricto de navegación/servicios sin `any`.

## 🔍 Plan de Auditoría y Mejoras

### Fase 1: Corrección de bugs detectados (B1–B15)
- [x] **B1 / B15**: Evitar sobrescritura automática de portada al abrir `EditBookScreen`, añadir `AbortController` y selector múltiple de portadas + «Quitar portada».
- [x] **B2**: Corregir spread inválido `...theme.shadow` por `...theme.shadow.soft`/`.medium` en `BarChart`, `DonutChart`, `StatsScreen`, `AddBookScreen` y `EditBookScreen`.
- [x] **B3 / B14**: Acotar el delay de entrada de `BookCard`, resetear `imageError` al cambiar `coverUrl` y usar colores temáticos reales en bordes/notas.
- [x] **B4 / B13**: Alinear estadísticas por año seleccionado (`avgDaysPerBook`, valoraciones, ánimos y géneros), proteger división por cero en reto lector, centralizar claves de `AsyncStorage` y limpiar imports sin uso.
- [x] **B5**: Permitir títulos cortos (1–2 caracteres como *It*, *Yo*, *Oz*) en `parser.ts` y mostrar progreso real al importar notas.
- [x] **B6**: Añadir token de contraste `colors.onAccent` (WCAG AA/AAA) en modo claro y oscuro para botones y chips primarios.
- [x] **B7**: Propagar y mostrar errores de red con opción de reintentar en *Descubrir* (`internetSearchService` / `InternetSearchScreen`).
- [x] **B8**: Generar chips de año dinámicos según la biblioteca real en `BooksScreen`, buscar también en género/cita y mostrar resultados directos al filtrar o buscar.
- [x] **B9**: Usar fecha local (`yyyy-MM-dd`) en nombres de archivo JSON/CSV en `backupService.ts`.
- [x] **B10 / B11 / B12**: Limpiar `isFetchingCover` y `errors` en `AddBookScreen`, detener `Animated.loop` en `SkeletonLoader` y proteger promesas en `HapticService`.

### Fase 2: Refactorización, rendimiento y diseño/UX
- [ ] Extraer formulario compartido `BookForm.tsx` para unificar `AddBookScreen` y `EditBookScreen`.
- [ ] Virtualizar el listado de libros en `BooksScreen` con `FlatList` para grandes bibliotecas.
- [x] Reordenar jerarquía visual de `StatsScreen` (protagonismo al Reto Lector y gráficas; herramientas de mantenimiento debajo) y añadir desglose por género más leído.
- [ ] Mejorar visualización mensual/anual en `BarChart` (barras reales o etiquetas de valor claras) — *(progreso live en sincronización de portadas ya añadido)*.
- [ ] Añadir lint/formato automatizado en CI (`.github/workflows/ci.yml`).

### Fase 3: Nuevas funcionalidades
- [ ] Estados de lectura (*Leyendo ahora* con progreso, *Pendientes / Wishlist* y *Leídos*).
- [ ] Filtro por género en Biblioteca.
- [ ] Compartir tarjeta/resumen de lectura o cita favorita desde `BookDetailScreen`.
- [ ] Búsqueda directa por ISBN en *Descubrir*.
