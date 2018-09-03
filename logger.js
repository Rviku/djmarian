const pino = require('pino')
const log = pino({
    prettyPrint: {
      levelFirst: true
    },
    prettifier: require('pino-pretty'),
    level: 20
  })
module.exports = log;