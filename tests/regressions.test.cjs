const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Ejecuta los servicios TypeScript con adaptadores nativos simulados, sin emulador.
function loader(mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const full = path.resolve(filename);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} };
    cache.set(full, module);
    const js = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    const localRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      return name.startsWith('.') ? load(path.resolve(path.dirname(full), `${name}.ts`)) : require(name);
    };
    new Function('require', 'module', 'exports', js)(localRequire, module, module.exports);
    return module.exports;
  }
  return load;
}

const book = (id, year = 2024, days = 2) => ({
  id, title: `Libro ${id}`, startDate: `${year}-01-01`, endDate: `${year}-01-${String(days).padStart(2, '0')}`,
  rating: 'Bueno', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
});

test('el parser conserva títulos numéricos y nombres que contienen meses', () => {
  const { parseNotes } = loader()('src/utils/parser.ts');
  const result = parseNotes('2024\nEnero\n1984\n22/11/63\nMarzo rojo\n- Dune\n1. Otro libro\n2025\nFebrero\nÚltimo');
  assert.deepEqual(result.map(b => b.title), ['1984', '22/11/63', 'Marzo rojo', 'Dune', 'Otro libro', 'Último']);
  assert.equal(result[0].year, 2024);
  assert.equal(result.at(-1).year, 2025);
  assert.equal(result.at(-1).month, 2);
});

test('la validación rechaza campos, fechas y duplicados antes de escribir', () => {
  const { validateBooks } = loader()('src/utils/bookValidation.ts');
  assert.deepEqual(validateBooks([]), []);
  assert.equal(validateBooks([book('1')]).length, 1);
  for (const value of [null, {}, [null], [{ ...book('1'), title: 7 }], [book('1'), book('1')],
    [{ ...book('1'), endDate: '2024-02-30' }], [{ ...book('1'), endDate: '2023-12-01' }],
    [{ ...book('1'), rating: 'Excelente' }], [{ ...book('1'), startDate: '2024' }]]) {
    assert.throws(() => validateBooks(value));
  }
});

test('las fechas admitidas por versiones anteriores no bloquean la carga ni las altas', async () => {
  const original = [
    { ...book('iso'), startDate: '2024-01-01T12:00:00.000Z', endDate: '2024-01-02T12:00:00.000Z' },
    { ...book('mes'), startDate: '2024-02', endDate: '2024-03' },
  ];
  let stored = JSON.stringify(original);
  const initial = stored;
  const service = loader({ '@react-native-async-storage/async-storage': {
    getItem: async () => stored,
    setItem: async (_, value) => { stored = value; },
  } })('src/services/bookStorage.ts');
  assert.deepEqual(await service.getAllBooks(), original);
  assert.equal(stored, initial, 'leer no modifica el almacenamiento');
  await service.saveBook(book('nuevo'));
  assert.equal(JSON.parse(stored).length, 3);
  assert.deepEqual(JSON.parse(stored).slice(0, 2), original);
  await service.updateBook('iso', { coverUrl: 'https://example.org/cover.jpg' });
  assert.equal(JSON.parse(stored)[0].startDate, original[0].startDate);
  const beforeInvalid = stored;
  await assert.rejects(service.saveBook(original[0]), /fechas de lectura/);
  await assert.rejects(service.updateBook('iso', { startDate: '2024-02-30' }), /fechas de lectura/);
  assert.equal(stored, beforeInvalid);
  await service.replaceAllBooks(original);
  assert.deepEqual(await service.getAllBooks(), original);
});

test('los datos incompatibles indican el registro y el campo sin sobrescribir la biblioteca', async () => {
  const stored = JSON.stringify([book('1'), { ...book('2'), rating: 'Desconocida' }]);
  let writes = 0;
  const service = loader({ '@react-native-async-storage/async-storage': {
    getItem: async () => stored,
    setItem: async () => { writes++; },
  } })('src/services/bookStorage.ts');
  await assert.rejects(service.getAllBooks(), /Libro 2: valoración no reconocida/);
  await assert.rejects(service.saveBook(book('3')), /Libro 2: valoración no reconocida/);
  assert.equal(writes, 0);
  const { validateBooks } = loader()('src/utils/bookValidation.ts');
  assert.throws(() => validateBooks([{ ...book('1'), title: null }]), /campo title/);
  assert.throws(() => validateBooks([{ ...book('1'), endDate: '2024-02-30' }], true), /fechas de lectura/);
});

test('la biblioteca inicial solo se escribe en una instalación sin datos guardados', async () => {
  let stored = null;
  let writes = 0;
  const storage = {
    getItem: async () => stored,
    setItem: async (_, value) => { writes++; stored = value; },
  };
  const service = loader({ '@react-native-async-storage/async-storage': storage })('src/services/bookStorage.ts');
  await service.initializeBooksOnFirstRun([book('semilla')]);
  await service.initializeBooksOnFirstRun([book('otra-semilla')]);
  assert.equal(JSON.parse(stored)[0].id, 'semilla');
  assert.equal(writes, 1);

  stored = '[]';
  await service.initializeBooksOnFirstRun([book('no-debe-importarse')]);
  assert.deepEqual(JSON.parse(stored), []);
  assert.equal(writes, 1);
});

test('el historial inicial incluye todos los títulos y fechas válidas de 2023 a 2026', () => {
  const { createInitialLibrary } = loader()('src/services/initialLibrary.ts');
  const { validateBooks } = loader()('src/utils/bookValidation.ts');
  const books = createInitialLibrary();
  assert.equal(books.length, 62);
  assert.ok(books.some(item => item.title === 'Maldita Roma' && item.endDate === '2023-12-28'));
  assert.ok(books.some(item => item.title === 'El silmarilion' && item.endDate.startsWith('2025-01')));
  assert.ok(books.some(item => item.title === 'Lazarillo de Tormes' && item.endDate.startsWith('2026-09')));
  assert.equal(validateBooks(books).length, 62);
});

test('las escrituras concurrentes conservan todos los libros y las actualizaciones', async () => {
  let stored = '[]';
  const storage = {
    getItem: async () => stored,
    setItem: async (_, value) => { await new Promise(resolve => setTimeout(resolve, 2)); stored = value; },
  };
  const service = loader({ '@react-native-async-storage/async-storage': storage })('src/services/bookStorage.ts');
  const saved = await Promise.all(Array.from({ length: 8 }, (_, i) => service.saveBook(book(String(i)))));
  assert.equal(JSON.parse(stored).length, 8);
  await Promise.all([service.updateBook(saved[0].id, { title: 'Editado' }), service.deleteBook(saved[1].id)]);
  assert.equal(JSON.parse(stored).length, 7);
  assert.equal(JSON.parse(stored).find(b => b.id === saved[0].id).title, 'Editado');
});

test('una lectura fallida o corrupta no provoca sobrescrituras; la cola se recupera', async () => {
  let stored = '{corrupto';
  let writes = 0;
  let failRead = false;
  const service = loader({ '@react-native-async-storage/async-storage': {
    getItem: async () => { if (failRead) throw new Error('fallo de lectura'); return stored; },
    setItem: async (_, value) => { writes++; stored = value; },
  } })('src/services/bookStorage.ts');
  await assert.rejects(service.saveBook(book('1')));
  failRead = true;
  await assert.rejects(service.deleteBook('1'));
  assert.equal(writes, 0);
  failRead = false;
  stored = '[]';
  await service.saveBook(book('2'));
  assert.equal(writes, 1);
});

test('restauración inválida o cancelada conserva los datos; una copia vacía requiere confirmación', async () => {
  let stored = JSON.stringify([book('original')]);
  let payload;
  let canceled = false;
  let confirmations = 0;
  const load = loader({
    '@react-native-async-storage/async-storage': {
      getItem: async () => stored, setItem: async (_, value) => { stored = value; },
    },
    'expo-file-system': { File: class { async text() { return JSON.stringify(payload); } } },
    'expo-sharing': {},
    'expo-document-picker': { getDocumentAsync: async () => ({ canceled, assets: [{ uri: 'test.json' }] }) },
  });
  const { importBackup } = load('src/services/backupService.ts');
  const confirm = async () => { confirmations++; return true; };
  payload = { app: 'LibroTrack', version: '1.0.0', books: [{ id: 'inválido' }] };
  await assert.rejects(importBackup(confirm));
  assert.equal(confirmations, 0);
  payload.books = [book('nuevo')];
  assert.equal(await importBackup(async () => false), null);
  assert.equal(JSON.parse(stored)[0].id, 'original');
  canceled = true;
  assert.equal(await importBackup(confirm), null);
  canceled = false;
  assert.equal(await importBackup(confirm), 1);
  assert.equal(JSON.parse(stored)[0].id, 'nuevo');
  payload.books = [];
  assert.equal(await importBackup(confirm), 0);
  assert.equal(stored, '[]');
  assert.equal(confirmations, 2);
});

test('booksToCsv formatea en RFC 4180 con BOM, orden descendente y protección ante fórmulas', () => {
  const load = loader({
    '@react-native-async-storage/async-storage': {},
    'expo-file-system': {},
    'expo-sharing': {},
    'expo-document-picker': {},
  });
  const { booksToCsv } = load('src/services/backupService.ts');
  const emptyCsv = booksToCsv([]);
  assert.ok(emptyCsv.startsWith('\uFEFF'));
  assert.equal(emptyCsv, '\uFEFFTítulo,Autor,Género,Valoración,Estado de ánimo,Fecha de inicio,Fecha de fin,Días de lectura,Notas,Cita favorita,Portada');

  const input = [
    {
      ...book('antiguo', 2023, 5),
      title: 'El "antiguo", tomo 1',
      author: 'Autor, A.',
      genre: 'Novela',
      mood: '🔥',
      notes: 'Línea 1\nLínea 2',
      quote: '=HYPERLINK("https://example.org")',
      coverUrl: 'https://example.org/antiguo.jpg',
    },
    {
      ...book('reciente', 2025, 1),
      title: '-1984',
      notes: '+resumen',
      quote: '@nota',
    },
  ];
  const snapshot = JSON.stringify(input);
  const csv = booksToCsv(input);
  assert.equal(JSON.stringify(input), snapshot, 'no muta la lista original');

  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines[0], 'Título,Autor,Género,Valoración,Estado de ánimo,Fecha de inicio,Fecha de fin,Días de lectura,Notas,Cita favorita,Portada');
  assert.equal(lines[1], "'-1984,,,Bueno,,2025-01-01,2025-01-01,1,'+resumen,'@nota,");
  assert.equal(
    lines.slice(2).join('\r\n'),
    '"El ""antiguo"", tomo 1","Autor, A.",Novela,Bueno,🔥,2023-01-01,2023-01-05,5,"Línea 1\nLínea 2","\'=HYPERLINK(""https://example.org"")",https://example.org/antiguo.jpg',
  );
});

test('exportBooksCsv y exportBackup escriben y comparten archivos respetando disponibilidad', async () => {
  let stored = JSON.stringify([book('uno', 2024, 4)]);
  let sharingAvailable = true;
  let dirCreated = false;
  const written = [];
  const shared = [];

  class MockDirectory {
    constructor(base, name) {
      this.uri = `${base}/${name}`;
      this.exists = false;
    }
    create() {
      dirCreated = true;
      this.exists = true;
    }
  }
  class MockFile {
    constructor(dir, name) {
      this.uri = `${dir.uri}/${name}`;
    }
    async write(content) {
      written.push({ uri: this.uri, content });
    }
  }

  const load = loader({
    '@react-native-async-storage/async-storage': {
      getItem: async () => stored,
      setItem: async (_, value) => { stored = value; },
    },
    'expo-file-system': { Directory: MockDirectory, File: MockFile, Paths: { cache: 'file:///cache' } },
    'expo-sharing': {
      isAvailableAsync: async () => sharingAvailable,
      shareAsync: async (uri, options) => { shared.push({ uri, options }); },
    },
    'expo-document-picker': {},
  });
  const { exportBooksCsv, exportBackup } = load('src/services/backupService.ts');

  const csvUri = await exportBooksCsv();
  assert.match(csvUri, /^file:\/\/\/cache\/backups\/librotrack-biblioteca-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(dirCreated, true);
  assert.equal(written.length, 1);
  assert.ok(written[0].content.startsWith('\uFEFFTítulo,'));
  assert.ok(written[0].content.includes('Libro uno'));
  assert.equal(shared[0].options.mimeType, 'text/csv');
  assert.equal(shared[0].options.UTI, 'public.comma-separated-values-text');

  const jsonUri = await exportBackup();
  assert.match(jsonUri, /^file:\/\/\/cache\/backups\/librotrack-backup-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(shared[1].options.mimeType, 'application/json');
  assert.equal(JSON.parse(written[1].content).totalBooks, 1);

  sharingAvailable = false;
  await assert.rejects(exportBooksCsv(), /exportación CSV/);
  await assert.rejects(exportBackup(), /copia de seguridad/);
  assert.equal(written.length, 2);
});

test('los récords se calculan por año y también para toda la biblioteca', () => {
  const { calculateStats } = loader()('src/services/statsService.ts');
  const books = [book('rápido-global', 2023, 1), book('lento-global', 2023, 30), book('rápido-año', 2024, 3), book('lento-año', 2024, 9)];
  const annual = calculateStats(books, 20, 2024);
  assert.equal(annual.fastestBook.id, 'rápido-año');
  assert.equal(annual.slowestBook.id, 'lento-año');
  const total = calculateStats(books, 20, 0);
  assert.equal(total.fastestBook.id, 'rápido-global');
  assert.equal(total.slowestBook.id, 'lento-global');
  assert.equal(calculateStats(books, 20, 2025).fastestBook, null);
});

test('un fallo al escribir conserva los datos y no bloquea las operaciones siguientes', async () => {
  let stored = JSON.stringify([book('original')]);
  let failWrite = true;
  const service = loader({ '@react-native-async-storage/async-storage': {
    getItem: async () => stored,
    setItem: async (_, value) => { if (failWrite) throw new Error('fallo de escritura'); stored = value; },
  } })('src/services/bookStorage.ts');
  await assert.rejects(service.replaceAllBooks([book('nuevo')]));
  assert.equal(JSON.parse(stored)[0].id, 'original');
  failWrite = false;
  await service.updateBook('original', { title: 'Recuperado', id: 'otro' });
  assert.equal(JSON.parse(stored)[0].id, 'original');
  assert.equal(JSON.parse(stored)[0].title, 'Recuperado');
});

test('el calendario empieza en lunes y muestra correctamente febrero bisiesto', () => {
  const { getCalendarDays } = loader()('src/utils/calendar.ts');
  const leap = getCalendarDays(new Date(2024, 1, 15));
  assert.deepEqual(leap.slice(0, 4), [null, null, null, '2024-02-01']);
  assert.equal(leap.filter(Boolean).length, 29);
  assert.equal(leap.length % 7, 0);
  assert.equal(leap.filter(Boolean).at(-1), '2024-02-29');
  assert.equal(getCalendarDays(new Date(2025, 1, 1)).filter(Boolean).length, 28);
  assert.equal(getCalendarDays(new Date(2026, 2, 1))[6], '2026-03-01');
});

test('el calendario admite el mismo día y bloquea las fechas fuera del intervalo', () => {
  const { isSelectableDate } = loader()('src/utils/calendar.ts');
  assert.equal(isSelectableDate('2024-02-29', '2024-02-29', '2024-02-29'), true);
  assert.equal(isSelectableDate('2024-02-28', '2024-02-29'), false);
  assert.equal(isSelectableDate('2024-03-01', undefined, '2024-02-29'), false);
  assert.equal(isSelectableDate('2025-02-29'), false);
  assert.equal(isSelectableDate('2024-02'), false);
});

test('las fechas del calendario conservan el día local y se muestran en formato español', () => {
  const { getCalendarDays } = loader()('src/utils/calendar.ts');
  const { formatShortDate } = loader()('src/utils/dateUtils.ts');
  const days = getCalendarDays(new Date(2026, 9, 25));
  assert.equal(days.filter(Boolean)[0], '2026-10-01');
  assert.equal(days.filter(Boolean).at(-1), '2026-10-31');
  assert.equal(formatShortDate('2026-10-25'), '25/10/2026');
});

test('las portadas se ordenan por título y autor y se eliminan duplicados y otros libros', () => {
  const { rankBookCovers } = loader()('src/services/bookCoverService.ts');
  const candidate = (url, title, author) => ({ url, title, author, source: 'Google Books' });
  const covers = rankBookCovers([
    candidate('otro', 'Otro libro', 'Gabriel García Márquez'),
    candidate('autor-incorrecto', 'Cien años de soledad', 'Juan Pérez'),
    candidate('parcial', 'Cien años de soledad: edición ilustrada', 'Gabriel García Márquez'),
    candidate('exacta', 'Cien años de soledad', 'Gabriel García Márquez'),
    candidate('exacta', 'Cien años de soledad', 'Gabriel García Márquez'),
  ], 'Cien anos de soledad', 'Gabriel Garcia Marquez');
  assert.deepEqual(covers.map(cover => cover.url), ['exacta', 'parcial']);
});

test('combina proveedores, usa HTTPS y cachea búsquedas equivalentes', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    requests++;
    if (url.includes('googleapis.com')) return { ok: true, json: async () => ({ items: [
      { volumeInfo: { title: 'Dune', authors: ['Frank Herbert'], imageLinks: { thumbnail: 'http://books.google.com/cover' } } },
      { volumeInfo: { title: 'Dune' } },
      null,
    ] }) };
    return { ok: true, json: async () => ({ docs: [{ title: 'Dune', author_name: ['Frank Herbert'], cover_i: 123 }, { title: 'Dune' }] }) };
  });
  const { searchBookCovers } = loader()('src/services/bookCoverService.ts');
  const covers = await searchBookCovers('Dune', 'Frank Herbert');
  assert.equal(covers.length, 2);
  assert.equal(covers[0].url, 'https://books.google.com/cover');
  assert.match(covers[1].url, /default=false$/);
  assert.equal(requests, 2);
  await searchBookCovers(' DUNE ', 'frank herbert');
  assert.equal(requests, 2);
  await searchBookCovers('Dune', 'Frank Herbert', undefined, true);
  assert.equal(requests, 4);
});

test('si un proveedor falla se aprovecha el otro; los fallos parciales no se cachean', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    requests++;
    if (url.includes('googleapis.com')) return { ok: false, status: 429 };
    return { ok: true, json: async () => ({ docs: [{ title: 'Dune', cover_i: 321 }] }) };
  });
  const { searchBookCovers } = loader()('src/services/bookCoverService.ts');
  assert.equal((await searchBookCovers('Dune')).length, 1);
  await searchBookCovers('Dune');
  assert.equal(requests, 4);
});

test('la cancelación descarta respuestas tardías aunque el transporte ignore abort', async t => {
  const completions = [];
  t.mock.method(globalThis, 'fetch', () => new Promise(resolve => completions.push(resolve)));
  const { searchBookCovers } = loader()('src/services/bookCoverService.ts');
  const controller = new AbortController();
  const request = searchBookCovers('Dune', '', controller.signal);
  const rejected = assert.rejects(request, { name: 'AbortError' });
  controller.abort();
  for (const resolve of completions) resolve({ ok: true, json: async () => ({ docs: [{ title: 'Dune', cover_i: 321 }] }) });
  await rejected;
});

test('las peticiones lentas se cancelan a los seis segundos y permiten reintentar', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('timeout')));
  }));
  const { searchBookCovers, fetchBookCoverUrl } = loader()('src/services/bookCoverService.ts');
  const search = searchBookCovers('Dune');
  const rejected = assert.rejects(search, /No se pudieron consultar/);
  t.mock.timers.tick(6000);
  await rejected;
  const fallback = fetchBookCoverUrl('Dune');
  t.mock.timers.tick(6000);
  assert.equal(await fallback, null);
});

test('las animaciones de detalle calculan parallax, cabecera fija, movimiento reducido y duración', () => {
  const {
    computeBookDetailMotion,
    formatReadingDuration,
    DETAIL_HEADER_HEIGHT,
    STICKY_HEADER_START,
    STICKY_HEADER_END,
  } = loader()('src/utils/bookDetailMotion.ts');

  const atRest = computeBookDetailMotion(0, false);
  assert.equal(atRest.headerTranslateY, 0);
  assert.equal(atRest.headerScale, 1);
  assert.equal(atRest.coverScale, 1);
  assert.equal(atRest.stickyBarOpacity, 0);
  assert.equal(atRest.stickyTitleTranslateY, 10);

  const overscroll = computeBookDetailMotion(-DETAIL_HEADER_HEIGHT, false);
  assert.equal(overscroll.headerScale, 1.5);
  assert.ok(overscroll.headerTranslateY < 0);

  const midSticky = computeBookDetailMotion((STICKY_HEADER_START + STICKY_HEADER_END) / 2, false);
  assert.ok(midSticky.stickyBarOpacity > 0.45 && midSticky.stickyBarOpacity < 0.55);
  assert.ok(midSticky.coverScale < 1 && midSticky.coverScale >= 0.92);

  const scrolled = computeBookDetailMotion(DETAIL_HEADER_HEIGHT * 2, false);
  assert.equal(scrolled.stickyBarOpacity, 1);
  assert.equal(scrolled.stickyTitleTranslateY, 0);
  assert.equal(scrolled.headerScale, 1);
  assert.equal(scrolled.coverScale, 0.92);

  const reduced = computeBookDetailMotion(DETAIL_HEADER_HEIGHT, true);
  assert.equal(reduced.headerTranslateY, 0);
  assert.equal(reduced.headerScale, 1);
  assert.equal(reduced.coverScale, 1);
  assert.equal(reduced.coverTranslateY, 0);
  assert.equal(reduced.stickyBarOpacity, 1);
  assert.equal(reduced.stickyTitleTranslateY, 0);

  assert.equal(formatReadingDuration(1), '1 día');
  assert.equal(formatReadingDuration(12), '12 días');
  assert.equal(formatReadingDuration(0), '0 días');
  assert.equal(formatReadingDuration(-3), '0 días');
});

test('los recordatorios del reto lector generan mensajes, triggers y saneado de ajustes', () => {
  const service = loader({
    '@react-native-async-storage/async-storage': {},
    'expo-notifications': {
      SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
    },
    'react-native': { Platform: { OS: 'android' } },
  })('src/services/notificationService.ts');

  const normalized = service.normalizeReminderSettings({
    enabled: 1,
    frequency: 'otro',
    weekday: 99,
    hour: -4,
    minute: 75,
    notificationId: '   ',
  });
  assert.deepEqual(normalized, {
    enabled: true,
    frequency: 'weekly',
    weekday: 7,
    hour: 0,
    minute: 59,
    notificationId: null,
  });

  const zeroMsg = service.buildReadingChallengeNotification({ year: 2026, current: 0, goal: 12 });
  assert.match(zeroMsg.title, /2026/);
  assert.match(zeroMsg.body, /12 libros/);

  const midMsg = service.buildReadingChallengeNotification({ year: 2026, current: 11, goal: 12 });
  assert.equal(midMsg.title, 'Reto lector 2026: 11/12 (92%)');
  assert.match(midMsg.body, /falta 1 libro/);

  const doneMsg = service.buildReadingChallengeNotification({ year: 2026, current: 15, goal: 12 });
  assert.equal(doneMsg.title, 'Reto lector 2026 completado');
  assert.match(doneMsg.body, /15 de 12 libros/);

  assert.deepEqual(
    service.buildReminderTrigger({ frequency: 'daily', weekday: 2, hour: 21, minute: 30 }, 'reto-lector'),
    { type: 'daily', hour: 21, minute: 30, channelId: 'reto-lector' },
  );
  assert.deepEqual(
    service.buildReminderTrigger({ frequency: 'weekly', weekday: 2, hour: 9, minute: 5 }),
    { type: 'weekly', weekday: 2, hour: 9, minute: 5 },
  );
  assert.equal(service.formatReminderSummary({ ...normalized, enabled: false }), 'Desactivado');
  assert.equal(
    service.formatReminderSummary({ ...normalized, enabled: true, frequency: 'daily', hour: 20, minute: 0 }),
    'Todos los días a las 20:00',
  );
  assert.equal(
    service.formatReminderSummary({ ...normalized, enabled: true, frequency: 'weekly', weekday: 2, hour: 9, minute: 5 }),
    'Cada lunes a las 09:05',
  );
});

test('applyReminderSettings y syncReadingChallengeReminder gestionan permisos, cancelación y reprogramación', async () => {
  let stored = null;
  let granted = true;
  let nextId = 1;
  const scheduled = [];
  const canceled = [];
  const channels = [];

  const service = loader({
    '@react-native-async-storage/async-storage': {
      getItem: async () => stored,
      setItem: async (_, value) => { stored = value; },
    },
    'expo-notifications': {
      SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
      AndroidImportance: { DEFAULT: 3 },
      setNotificationHandler: () => {},
      setNotificationChannelAsync: async (id, config) => { channels.push({ id, config }); },
      getPermissionsAsync: async () => ({ granted, status: granted ? 'granted' : 'denied' }),
      requestPermissionsAsync: async () => ({ granted, status: granted ? 'granted' : 'denied' }),
      scheduleNotificationAsync: async req => {
        const id = `notif-${nextId++}`;
        scheduled.push({ id, req });
        return id;
      },
      cancelScheduledNotificationAsync: async id => { canceled.push(id); },
    },
    'react-native': { Platform: { OS: 'android' } },
  })('src/services/notificationService.ts');

  const enabled = await service.applyReminderSettings(
    { enabled: true, frequency: 'weekly', weekday: 1, hour: 20, minute: 0 },
    { year: 2026, current: 4, goal: 20 },
  );
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.notificationId, 'notif-1');
  assert.equal(channels.length, 1);
  assert.equal(scheduled[0].req.trigger.type, 'weekly');
  assert.equal(scheduled[0].req.trigger.channelId, 'reto-lector');

  await service.syncReadingChallengeReminder({ year: 2026, current: 5, goal: 20 });
  assert.deepEqual(canceled, ['notif-1']);
  assert.equal(scheduled.length, 2);
  assert.match(scheduled[1].req.content.title, /5\/20/);

  const disabled = await service.applyReminderSettings(
    { enabled: false, frequency: 'weekly', weekday: 1, hour: 20, minute: 0 },
    { year: 2026, current: 5, goal: 20 },
  );
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.notificationId, null);
  assert.deepEqual(canceled, ['notif-1', 'notif-2']);

  granted = false;
  await assert.rejects(
    service.applyReminderSettings(
      { enabled: true, frequency: 'daily', weekday: 1, hour: 20, minute: 0 },
      { year: 2026, current: 5, goal: 20 },
    ),
    /Permiso de notificaciones denegado/,
  );
  assert.equal(JSON.parse(stored).enabled, false);
  assert.equal(scheduled.length, 2);
});

test('cloudBackupService normaliza Gist IDs, cifra token en SecureStore, sube privado y restaura con confirmación', async t => {
  const asyncStore = new Map();
  const secureStore = new Map();
  asyncStore.set('lecturas_books', JSON.stringify([book('local-1', 2025, 3)]));

  const requests = [];
  let remoteBooks = [book('nube-1', 2026, 4), book('nube-2', 2026, 7)];
  let forceTruncated = false;
  let forceStatus = null;

  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    requests.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });
    if (forceStatus) {
      return { ok: false, status: forceStatus, json: async () => ({}), text: async () => '' };
    }
    if (url.endsWith('/gists') && init.method === 'POST') {
      return {
        ok: true,
        status: 201,
        json: async () => ({ id: 'abcdef1234567890', updated_at: '2026-11-20T18:00:00.000Z' }),
      };
    }
    if (url.includes('/gists/abcdef1234567890') && init.method === 'PATCH') {
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'abcdef1234567890', updated_at: '2026-11-20T18:05:00.000Z' }),
      };
    }
    if (url.includes('/gists?per_page=30')) {
      return {
        ok: true,
        status: 200,
        json: async () => ([
          { id: '111111111111', files: { 'otro.txt': {} } },
          { id: 'abcdef1234567890', files: { 'librotrack-backup.json': {} } },
        ]),
      };
    }
    if (url.includes('/gists/abcdef1234567890') && (!init.method || init.method === 'GET')) {
      const content = JSON.stringify({
        app: 'LibroTrack',
        version: '1.0.0',
        exportedAt: '2026-11-20T18:10:00.000Z',
        totalBooks: remoteBooks.length,
        books: remoteBooks,
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 'abcdef1234567890',
          files: {
            'librotrack-backup.json': forceTruncated
              ? { truncated: true, raw_url: 'https://gist.githubusercontent.com/raw/backup.json', content: '' }
              : { truncated: false, content },
          },
        }),
      };
    }
    if (url.includes('gist.githubusercontent.com/raw/backup.json')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          app: 'LibroTrack',
          version: '1.0.0',
          exportedAt: '2026-11-20T18:15:00.000Z',
          totalBooks: remoteBooks.length,
          books: remoteBooks,
        }),
      };
    }
    throw new Error(`URL no simulada: ${url}`);
  });

  const service = loader({
    '@react-native-async-storage/async-storage': {
      getItem: async key => (asyncStore.has(key) ? asyncStore.get(key) : null),
      setItem: async (key, value) => { asyncStore.set(key, value); },
      removeItem: async key => { asyncStore.delete(key); },
    },
    'expo-secure-store': {
      getItemAsync: async key => (secureStore.has(key) ? secureStore.get(key) : null),
      setItemAsync: async (key, value) => { secureStore.set(key, value); },
      deleteItemAsync: async key => { secureStore.delete(key); },
    },
    'expo-file-system': {},
    'expo-sharing': {},
    'expo-document-picker': {},
    'react-native': { Platform: { OS: 'android' } },
  })('src/services/cloudBackupService.ts');

  assert.equal(service.normalizeGistId('https://gist.github.com/SergioBushido/abcdef1234567890#file-librotrack-backup-json'), 'abcdef1234567890');
  assert.equal(service.normalizeGistId('abcdef1234567890'), 'abcdef1234567890');
  assert.equal(service.normalizeGistId('no-es-valido!'), null);

  await assert.rejects(service.saveCloudBackupCredentials('', ''), /token personal/);
  await assert.rejects(service.saveCloudBackupCredentials('ghp_123456', 'invalido!'), /formato válido/);

  const savedCfg = await service.saveCloudBackupCredentials('ghp_secret_token_123');
  assert.equal(savedCfg.hasToken, true);
  assert.equal(secureStore.get(service.CLOUD_TOKEN_KEY), 'ghp_secret_token_123');
  assert.ok(!String(asyncStore.get(service.CLOUD_META_KEY)).includes('ghp_secret_token_123'), 'el token nunca se guarda en AsyncStorage');

  const firstUpload = await service.uploadCloudBackup();
  assert.equal(firstUpload.created, true);
  assert.equal(firstUpload.gistId, 'abcdef1234567890');
  assert.equal(firstUpload.totalBooks, 1);
  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].body.public, false);

  const secondUpload = await service.uploadCloudBackup();
  assert.equal(secondUpload.created, false);
  assert.equal(requests[1].method, 'PATCH');

  // Auto-descubrimiento desde otro dispositivo (sin gistId guardado) + archivo truncado
  await service.saveCloudBackupCredentials('', '');
  forceTruncated = true;
  assert.equal(await service.downloadCloudBackup(async () => false), null);
  assert.equal(JSON.parse(asyncStore.get('lecturas_books'))[0].id, 'local-1', 'cancelar conserva la biblioteca');

  const restored = await service.downloadCloudBackup(async count => count === 2);
  assert.equal(restored, 2);
  assert.equal(JSON.parse(asyncStore.get('lecturas_books')).length, 2);
  assert.equal(JSON.parse(asyncStore.get('lecturas_books'))[0].id, 'nube-1');

  forceStatus = 401;
  await assert.rejects(service.uploadCloudBackup(), /inválido o expirado/);

  const cleared = await service.clearCloudBackupConfig();
  assert.equal(cleared.hasToken, false);
  assert.equal(secureStore.has(service.CLOUD_TOKEN_KEY), false);
});

test('sortBooks y groupBooksByYear ordenan por fecha, valoración, título español y duración sin mutar', () => {
  const { sortBooks, groupBooksByYear, isBookSortOption } = loader()('src/utils/filters.ts');
  assert.equal(isBookSortOption('rating_desc'), true);
  assert.equal(isBookSortOption('desconocido'), false);

  const library = [
    { ...book('b', 2024, 10), title: 'Zafiro', rating: 'Regular' },
    { ...book('a', 2023, 2), title: 'Árbol', rating: 'Muy bueno' },
    { ...book('c', 2025, 5), title: 'Bosque', rating: 'Bueno' },
  ];
  const snapshot = JSON.stringify(library);

  assert.deepEqual(sortBooks(library, 'date_desc').map(item => item.id), ['c', 'b', 'a']);
  assert.deepEqual(sortBooks(library, 'date_asc').map(item => item.id), ['a', 'b', 'c']);
  assert.deepEqual(sortBooks(library, 'rating_desc').map(item => item.id), ['a', 'c', 'b']);
  assert.deepEqual(sortBooks(library, 'title_asc').map(item => item.id), ['a', 'c', 'b']);
  assert.deepEqual(sortBooks(library, 'duration_asc').map(item => item.id), ['a', 'c', 'b']);
  assert.equal(JSON.stringify(library), snapshot, 'no muta el array de entrada');

  assert.deepEqual(groupBooksByYear(library, 'date_desc').map(section => section.title), ['2025', '2024', '2023']);
  assert.deepEqual(groupBooksByYear(library, 'date_asc').map(section => section.title), ['2023', '2024', '2025']);
});

test('parseReadingGoal y calculateStats filtran métricas por año, desglosan géneros y evitan NaN/Infinity', () => {
  const { parseReadingGoal } = loader()('src/constants/storageKeys.ts');
  assert.equal(parseReadingGoal('25'), 25);
  assert.equal(parseReadingGoal('0'), 20);
  assert.equal(parseReadingGoal('-5'), 20);
  assert.equal(parseReadingGoal('abc'), 20);
  assert.equal(parseReadingGoal(null), 20);

  const { calculateStats } = loader()('src/services/statsService.ts');
  const library = [
    { ...book('a23', 2023, 20), rating: 'Malo', genre: 'Terror', mood: '🌧️' },
    { ...book('a24', 2024, 4), rating: 'Muy bueno', genre: 'Novela', mood: '🔥' },
    { ...book('b24', 2024, 6), rating: 'Bueno', genre: 'Novela', mood: '☀️' },
  ];

  const stats2024 = calculateStats(library, 0, 2024);
  assert.equal(stats2024.avgDaysPerBook, 5);
  assert.equal(stats2024.booksByRating['Malo'], 0);
  assert.equal(stats2024.booksByRating['Muy bueno'], 1);
  assert.deepEqual(stats2024.booksByGenre, { Novela: 2 });
  assert.equal(stats2024.retaProgress.goal, 20);
  assert.equal(Number.isFinite(stats2024.retaProgress.percentage), true);

  const statsTotal = calculateStats(library, 10, 0);
  assert.equal(statsTotal.booksByRating['Malo'], 1);
  assert.deepEqual(statsTotal.booksByGenre, { Terror: 1, Novela: 2 });
  assert.equal(statsTotal.avgDaysPerBook, 10);
});

test('parseNotes conserva títulos cortos de 1-2 caracteres e ignora separadores vacíos', () => {
  const { parseNotes } = loader()('src/utils/parser.ts');
  const parsed = parseNotes('2025\nMarzo\n- It\n- Yo\n- Oz\n- ---\n- Q');
  assert.deepEqual(parsed.map(item => item.title), ['It', 'Yo', 'Oz', 'Q']);
});

test('searchBooksOnGoogle propaga errores HTTP y AbortError en lugar de ocultarlos', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 503, json: async () => ({}) }));
  const { searchBooksOnGoogle } = loader()('src/services/internetSearchService.ts');
  await assert.rejects(searchBooksOnGoogle('Dune'), /HTTP 503/);

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(searchBooksOnGoogle('Dune', controller.signal), { name: 'AbortError' });
});

test('computeBarChartMetrics calcula totales, picos, proporciones y maneja ceros con seguridad', () => {
  const { computeBarChartMetrics } = loader()('src/utils/chartMetrics.ts');
  const empty = computeBarChartMetrics([0, 0, 0], ['2024', '2025', '2026']);
  assert.equal(empty.hasData, false);
  assert.equal(empty.total, 0);
  assert.equal(empty.peakLabel, null);
  assert.deepEqual(empty.entries.map(item => item.ratio), [0, 0, 0]);

  const active = computeBarChartMetrics([2, 8, 4], ['2024', '2025', '2026']);
  assert.equal(active.hasData, true);
  assert.equal(active.total, 14);
  assert.equal(active.maxValue, 8);
  assert.equal(active.peakLabel, '2025');
  assert.deepEqual(active.entries.map(item => item.ratio), [0.25, 1, 0.5]);
  assert.deepEqual(active.entries.map(item => item.isPeak), [false, true, false]);
});
