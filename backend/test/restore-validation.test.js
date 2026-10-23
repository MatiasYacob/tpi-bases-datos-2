// Regresion de las expresiones mongosh originales, sin ejecutar restauraciones.
// Las respuestas de DB son fixtures; no demuestra mongorestore ni ejecucion en macOS.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const restore = readFileSync(new URL('../../scripts/restaurar-prueba.sh', import.meta.url), 'utf8');
const verifier = readFileSync(new URL('../../scripts/verificar-conteos.sh', import.meta.url), 'utf8');
const marker = '#============# Consultar los datos recuperados #============#';
const validation = restore.split(marker)[1]?.match(/--eval '([\s\S]*?)'/)?.[1];
const countValidation = verifier.match(/--eval '([\s\S]*?)'/)?.[1];
assert.ok(validation, 'Se debe ejecutar la expresion de validacion del script real');
assert.ok(countValidation, 'Se debe ejecutar la comparacion de conteos real');

function runValidation(orders) {
  let queries = 0;
  const logs = [];
  const db = {
    clientes: { countDocuments: () => 1 },
    productos: { countDocuments: () => 1 },
    pedidos: {
      countDocuments: () => orders.length,
      findOne(filter) {
        queries++;
        return orders.find(order => Object.entries(filter).every(([key, value]) => order[key] === value)) ?? null;
      },
    },
  };
  const context = { db, print: text => logs.push(text), printjson: value => logs.push(value),
    quit(code) { throw Object.assign(new Error('mongosh exit'), { code }); } };
  vm.runInNewContext(validation, context);
  return { logs, queries };
}
test('restauracion: pedido activo con items es valido', () => {
  assert.equal(runValidation([{ activo: true, items: [{ nombre: 'Mouse' }] }]).queries, 1);
});
test('restauracion: todos los pedidos inactivos son validos', () => {
  const order = { activo: false, items: [{ nombre: 'Mouse historico' }] };
  const result = runValidation([order]);
  assert.equal(result.queries, 1);
  assert.ok(result.logs.includes(order));
});
test('restauracion: cero pedidos no exige un documento inexistente', () => {
  const result = runValidation([]);
  assert.equal(result.queries, 0);
  assert.ok(result.logs.some(value => typeof value === 'string' && value.includes('no contiene pedidos')));
});
test('restauracion: un pedido con items vacios sigue siendo rechazado', () => {
  assert.throws(() => runValidation([{ activo: false, items: [] }]), err => err.code === 1);
});
test('restauracion: los conteos se comparan antes de aceptar los datos', () => {
  const gate = '/bin/bash "$RAIZ/scripts/verificar-conteos.sh" "$FECHA"';
  assert.ok(restore.includes('set -euo pipefail'));
  assert.ok(restore.indexOf(gate) >= 0 && restore.indexOf(gate) < restore.indexOf(marker));
});
test('restauracion: cero pedidos no oculta una diferencia con el respaldo', () => {
  const context = {
    process: { env: { TPI_ARCHIVO_CONTEOS: '/fixture/conteos.json' } },
    require: () => ({ readFileSync: () => JSON.stringify({ clientes: 1, productos: 1, pedidos: 1 }) }),
    db: { getCollection: name => ({ countDocuments: () => name === 'pedidos' ? 0 : 1 }) },
    print() {}, quit(code) { throw Object.assign(new Error('mongosh exit'), { code }); },
  };
  assert.throws(() => vm.runInNewContext(countValidation, context), err => err.code === 1);
});
