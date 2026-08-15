/**
 * Per-request city-base scope, carried through async calls.
 *
 * An Express middleware binds the request's `?base=` value (ALL / PY / CH,
 * sent by the admin and user apps) into an AsyncLocalStorage context. The
 * city-scope mongoose plugin (cityScopePlugin.js) then reads it inside query
 * middleware — so `base` never has to be threaded through every function.
 *
 * Outside any request (cron jobs, CLI migration scripts) the store is empty,
 * so queries run unscoped.
 */

const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

/** Run `fn` with `base` bound to the async context for its whole call tree. */
function runWithBase(base, fn) {
  return storage.run({ base }, fn);
}

/** The city base bound to the current async context, or undefined if none. */
function getScopedBase() {
  const store = storage.getStore();
  return store ? store.base : undefined;
}

module.exports = { runWithBase, getScopedBase };
