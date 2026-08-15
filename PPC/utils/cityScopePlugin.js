/**
 * Mongoose plugin: transparently scope read queries to the active city base.
 *
 * Reads the request's base (ALL / PY / CH) from the AsyncLocalStorage context
 * set by the server's per-request middleware (see baseScope.js), and injects
 * baseFilter() into every list / count / aggregate query. 'ALL', an unknown
 * value, or no request context all yield an empty filter — i.e. no
 * restriction — so admin "All Cities", background jobs and CLI scripts are
 * unaffected.
 *
 * Deliberately NOT hooked:
 *   - findOne / findById — single-document lookups. Scoping them would break
 *     sequential-id generation (`findOne().sort({ ppcId: -1 })`) and the
 *     add-property flow (a freshly reserved stub could not be found back).
 *   - updateOne / findOneAndUpdate / delete* — writes are never scoped.
 * Browsing is still constrained, because every list the admin sees is scoped;
 * an out-of-city record simply never appears to be navigated to.
 *
 * Apply once per schema:  schema.plugin(require('.../cityScopePlugin'));
 */

const { baseFilter } = require('./baseFilter');
const { getScopedBase } = require('./baseScope');

module.exports = function cityScopePlugin(schema) {
  // Query middleware: `this` is a mongoose Query. Merge the base filter in.
  const scopeQuery = function () {
    const filter = baseFilter(getScopedBase());
    if (Object.keys(filter).length > 0) {
      this.where(filter);
    }
  };

  ['find', 'countDocuments', 'count'].forEach((op) => {
    schema.pre(op, scopeQuery);
  });

  // Aggregations: prepend a $match so the scope applies before any grouping.
  schema.pre('aggregate', function () {
    const filter = baseFilter(getScopedBase());
    if (Object.keys(filter).length > 0) {
      this.pipeline().unshift({ $match: filter });
    }
  });
};
