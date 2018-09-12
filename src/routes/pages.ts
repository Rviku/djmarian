import * as express from 'express'
import log from '../logger'
import * as path from 'path'
import * as tokenRefresh from '../token-refresh'

const router: express.Router = express.Router()
const userIdtokenMap = tokenRefresh.userIdtokenMap

router.get('/', (req, res) => {
    try {
        log.debug(`Received new main page request from IP: ${req.ip} - Cookie: ${req.cookies['djmarian-cookie']}`)
        if (req.session.userId ||
            userIdtokenMap.get(req.session.userId)) {
            
            let dir: string = path.join(__dirname, '/../../public', 'index.html')
            res.sendFile(dir)
        } else {
            res.redirect('/login')
        }
    } catch (err) {
        log.error(`Problem has occurred while requesting for main page: ${err}`)
        res.set('Content-Type', 'image/jpg')
        let dir: string = path.join(__dirname, 'public', '500.png')
        res.sendFile(dir)
    }
})

router.get('/ping', (req, res) => {
    log.debug('Ping -> Pong!')
    res.send('Pong!')
})

export default router