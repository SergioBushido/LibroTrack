# LibroTrack - Documentación para Agentes AI

Este documento proporciona contexto sobre la aplicación **LibroTrack** para que cualquier agente AI pueda entender rápidamente el propósito, la tecnología y el estado actual del proyecto.

## 📌 Propósito de la App
LibroTrack es una biblioteca personal de lectura diseñada para gestionar y visualizar el historial de libros leídos. Se enfoca en un diseño editorial premium y en proporcionar estadísticas detalladas sobre los hábitos de lectura.

## 🛠 Stack Tecnológico
- **Core**: React Native con Expo SDK 51 (TypeScript).
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

**Siguiente fase sugerida:**
- Implementación de copias de seguridad en la nube o exportación a JSON/CSV.
- Mejoras en el diseño de la pantalla de detalle (animaciones con Reanimated).
- Sistema de notificaciones para recordar el reto lector.
