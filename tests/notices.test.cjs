const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Comprueba las acciones del proveedor sin renderizador nativo.
// El aspecto, foco y gestos se verifican en Android.
function harness() {
  const slots = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useCallback: callback => callback,
    useEffect: () => {},
    useRef: value => {
      const index = cursor++;
      return slots[index] ??= { current: value };
    },
    useState: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
  };
  const native = {
    Keyboard: { dismiss() {} }, StyleSheet: { create: value => value },
    Modal: 'Modal', Pressable: 'Pressable', View: 'View', Text: 'Text', ScrollView: 'ScrollView',
  };
  const mocks = {
    react, 'react-native': native,
    '@expo/vector-icons/MaterialCommunityIcons': 'Icon',
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    './ThemeContext': { useTheme: () => ({ colors: {}, isDark: false }) },
    '../constants/theme': { theme: { typography: {}, borderRadius: {}, shadow: {} } },
  };
  const js = ts.transpileModule(fs.readFileSync('src/context/NoticeContext.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)(name => {
    if (!(name in mocks)) throw new Error(`Adaptador ausente: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const render = () => { cursor = 0; return module.exports.NoticeProvider({ children: null }); };
  return { render, api: render().props.value };
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (!Array.isArray(node) && predicate(node)) return node;
  for (const child of Array.isArray(node) ? node : node.children || []) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

test('Atrás cancela la confirmación sin ejecutar una acción destructiva', () => {
  const { api, render } = harness();
  let result;
  api.alert('Reemplazar', 'Biblioteca', [
    { text: 'Cancelar', style: 'cancel', onPress: () => { result = false; } },
    { text: 'Reemplazar', style: 'destructive', onPress: () => { result = true; } },
  ]);
  find(render(), node => node.type === 'Modal').props.onRequestClose();
  assert.equal(result, false);
  assert.equal(find(render(), node => node.type === 'Modal'), undefined);
});

test('una doble pulsación confirma una sola vez y conserva el siguiente aviso', () => {
  const { api, render } = harness();
  let confirmations = 0;
  api.alert('Primero', '', [{ text: 'Confirmar', onPress: () => { confirmations++; } }]);
  api.alert('Segundo');
  const button = find(render(), node => node.type === 'Pressable' && node.props.accessibilityRole === 'button');
  button.props.onPress();
  button.props.onPress();
  assert.equal(confirmations, 1);
  assert.ok(find(render(), node => node.type === 'Text' && node.children.includes('Segundo')));
});

test('onDismiss se ejecuta una vez y cancelable false respeta la decisión pendiente', () => {
  const { api, render } = harness();
  let dismissed = 0;
  api.alert('Aviso', '', undefined, { onDismiss: () => { dismissed++; } });
  const modal = find(render(), node => node.type === 'Modal');
  modal.props.onRequestClose();
  modal.props.onRequestClose();
  assert.equal(dismissed, 1);
  api.alert('Confirmación', '', undefined, { cancelable: false });
  find(render(), node => node.type === 'Modal').props.onRequestClose();
  assert.ok(find(render(), node => node.type === 'Modal'));
});
