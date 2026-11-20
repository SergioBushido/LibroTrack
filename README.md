# Lecturas

App móvil para llevar un registro de tu biblioteca personal, tus notas de lectura y estadísticas. Creada con React Native, Expo, y TypeScript.

## Requisitos Previos

- [Node.js](https://nodejs.org/en/)
- App Expo Go instalada en tu dispositivo (iOS/Android), o emulador configurado.

## Instalación

Instala las dependencias si no lo has hecho ya:

```bash
npm install
```

## Ejecución

Inicia el servidor de desarrollo de Expo:

```bash
npx expo start
```

Escanea el código QR que aparece en la terminal con la app Expo Go (Android) o la cámara (iOS).

## Tecnologías Utilizadas

- **React Native 0.81** + **Expo SDK 54**
- **TypeScript**
- **AsyncStorage** para persistencia local
- **React Navigation** (Bottom Tabs, Stack)
- **React Native Chart Kit** para gráficos
- **date-fns** para manejo de fechas

## Comprobaciones

### Avisos y confirmaciones

Los avisos usan el tema claro/oscuro de LibroTrack. Guardar, editar e importar muestran
una confirmación discreta y continúan la navegación sin pedir otro toque.
El aviso se puede cerrar y desaparece tras 6,5 segundos; con lector de pantalla permanece
hasta cerrarlo. Los errores conservan los detalles técnicos en un apartado desplegable.
Eliminar libros y reemplazar la biblioteca requieren confirmación explícita;
Atrás o tocar fuera del diálogo cancela la operación.

Verificación manual en Android:

1. Guardar y editar un libro: comprobar la navegación y el aviso de éxito.
2. Abrir la confirmación de eliminación y cancelarla con Atrás y tocando fuera.
3. Abrir la restauración de una copia y cancelar: los libros deben conservarse.
4. Probar un formulario incompleto y revisar un error con detalles desplegables.
5. Revisar ambos temas, texto grande y TalkBack: contenido desplazable, botones accesibles
   y aviso de éxito que permanece hasta cerrarlo.

```bash
npm run typecheck
npm test
npm run android
```

Las pruebas de regresión ejecutan los servicios con adaptadores nativos simulados.
No sustituyen las pruebas en un dispositivo Android/iOS.

## Copias de seguridad e importación

Desde Estadísticas puedes exportar y restaurar una copia JSON, incluso con una biblioteca vacía, así como exportar la biblioteca en CSV.
La copia JSON contiene los libros; no incluye el tema, el objetivo lector ni las imágenes de portada descargadas.
Las portadas se conservan como URLs. Guarda el archivo mediante el menú de compartir.
La exportación CSV genera un archivo UTF-8 con BOM compatible con Excel y Google Sheets, ordenado por fecha de fin descendente, con columnas en español, días de lectura calculados y escape RFC 4180 (con protección frente a inyección de fórmulas). Es un formato de solo exportación; para restaurar una biblioteca utiliza siempre la copia JSON.
Una restauración validada pide confirmación porque reemplaza toda la biblioteca, también si contiene cero libros.
Si los datos almacenados son inválidos, la aplicación bloquea su lectura y las modificaciones normales para evitar sobrescribirlos.

Para importar notas, utiliza encabezados como `2024` seguido de `Enero`, o un año explícito como `Año 2024`.
Los títulos ambiguos deben llevar una viñeta: `- 1984` o `- Mayo`. Revisa la previsualización antes de importar.
Si falla una importación parcial, la previsualización conserva solo los libros pendientes para reintentarlos.

### Verificación manual antes de aceptar cambios

1. En una instalación sin libros, restaurar una copia válida desde Estadísticas.
2. Cancelar la restauración y probar un JSON inválido: la biblioteca debe mantenerse intacta.
3. En una biblioteca de prueba, confirmar una copia vacía y comprobar que desaparecen todos los libros.
4. En Android, editar la cita y el reto; probar cancelar, guardar y un objetivo inválido.
5. Pulsar Guardar o Importar varias veces y comprobar que no aparecen duplicados.
6. Importar títulos numéricos, cambiar de año en Estadísticas y revisar los récords anuales y totales.
7. Revisar los modales con teclado abierto y en los temas claro y oscuro.

## Fechas de lectura e icono de instalación

Al añadir o editar un libro, toca la fecha de inicio o fin para abrir el calendario.
Se muestra en español, con semanas de lunes a domingo y controles para cambiar mes y año.
Las fechas se presentan como `dd/mm/aaaa` y se guardan como `YYYY-MM-DD`, sin conversión a UTC.
Se permite empezar y terminar el mismo día. Los días fuera del intervalo quedan deshabilitados.
Para desplazar un intervalo completo hacia fechas posteriores, cambia primero el fin; para adelantarlo, cambia primero el inicio.

Los iconos de instalación están en `assets/librotrack-*.png` y se configuran en `app.json`.
Usan el glifo de libro de MaterialCommunityIcons que ya utiliza la biblioteca.
Para regenerarlos en Windows: `powershell -File scripts/generate-app-icons.ps1`.

El icono forma parte de la aplicación nativa: recargar Expo no cambia el icono de una APK ya instalada.
Para generar una APK con el perfil existente, usa `npx eas-cli build --platform android --profile preview`
y actualiza la instalación con la nueva APK. No hace falta desinstalar la aplicación ni borrar sus datos.
Expo Go mantiene su propio icono como aplicación contenedora.

Comprobaciones manuales: seleccionar y cancelar fechas al añadir/editar, probar febrero bisiesto,
cambiar de año y verificar las restricciones inicio/fin. Comprobar también el icono instalado
en Android con iconos normales y temáticos. La compilación debe conservar el mismo identificador
y firma para poder actualizar la instalación existente.

## Búsqueda de portadas

Al añadir un libro se consultan Google Books y Open Library tras dejar de escribir durante 1,2 segundos.
Se ordenan hasta ocho portadas por coincidencia de título y autor, ignorando tildes y mayúsculas.
Puedes elegir otra edición o pulsar «Sin portada». Cambiar el título o el autor limpia la selección anterior.
La portada recibida desde Descubrir se conserva hasta que cambies los datos o elijas otra.

Cada proveedor tiene un límite de espera de seis segundos; si uno falla se utilizan los resultados del otro.
Las búsquedas satisfactorias se guardan en memoria cinco minutos. «Buscar portada» fuerza una consulta nueva.
Guardar el libro no espera a la red: utiliza la portada seleccionada en ese momento o guarda sin imagen.
Las imágenes dependen de la disponibilidad de los proveedores; no se descargan para uso sin conexión.

Para verificarlo en móvil, busca un título con autor, cambia rápidamente a otro, selecciona una portada
y guarda. Repite sin conexión, con una imagen que no cargue y desde el botón Añadir de Descubrir.
Comprueba también que editar e importar libros siguen obteniendo portadas mediante el servicio compartido.

Referencias: [Google Books](https://developers.google.com/books/docs/v1/using),
[búsqueda de Open Library](https://openlibrary.org/dev/docs/api/search) y
[portadas de Open Library](https://openlibrary.org/dev/docs/api/covers).

## Adaptación a distintos tamaños de pantalla

Las pantallas centran el contenido con un ancho máximo de 760 puntos. Las filas principales pasan
a una columna en ventanas de menos de 380 puntos o con una escala de texto superior al 120 %.
El ajuste se recalcula cuando cambia el tamaño de la ventana o la escala de fuente.
Los gráficos miden su contenedor, y los modales tienen ancho limitado y desplazamiento vertical.
La barra inferior se oculta con el teclado; en iOS el contenido también adapta su altura al teclado.
Se conserva la orientación vertical configurada para la app.

Antes de aceptar los cambios visuales, ejecutar `npm run android` o `npm run ios` y comprobar:

- Anchos de 320, 360 y 390 puntos, y tablets de 768 y 1024 puntos.
- Texto del sistema al 100 %, 150 % y 200 %, con títulos y autores largos.
- Añadir, editar e importar: alcanzar los últimos campos y guardar con el teclado abierto.
- Biblioteca, detalle, búsqueda y estadísticas: ausencia de recortes y desplazamiento horizontal involuntario.
- Calendario y edición de cita/reto: botones accesibles y contenido desplazable con poca altura.
- Gráficos y barra inferior tras redimensionar la ventana o utilizar pantalla dividida.

TypeScript, las pruebas de servicios y la exportación de Expo no sustituyen esta revisión visual en dispositivos.
