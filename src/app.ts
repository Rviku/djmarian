import * as express from 'express'
import log from './logger'
import login from './routes/login'
import pages from './routes/pages'
import config from './config/config'
import * as tokenRefresh  from './token-refresh'

const server: express.Express = express()

function initApp() {
  tokenRefresh.refreshTokenInLoop()
  server.use('/', login)
  server.use('/', pages)
  server.listen(config.port, config.host, () => {
    log.info(`Server running at http://${config.host}:${config.port}/`)
  })
}

/* istanbul ignore next */
if (require.main === module) {
  initApp()
}