import * as pino from 'pino'

const log: pino.Logger = pino({
    name: 'djmarian',
    level: 'debug'
})

export default log