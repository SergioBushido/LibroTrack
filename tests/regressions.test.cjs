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
