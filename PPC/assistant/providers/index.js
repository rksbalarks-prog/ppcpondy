// Provider selector. One interface, two implementations, chosen by env.
const config = require('../config');
const openai = require('./openai');
const mock = require('./mock');

const providers = { openai, mock };

function getProvider() {
  return providers[config.provider] || openai;
}

module.exports = { getProvider };
