import * as express from 'express'
import log from '../logger'
import * as path from 'path'
import * as session from 'express-session'
import * as cookieParser from 'cookie-parser'
import * as requestPromise from 'request-promise'
import config from '../config/config'
import * as spotifyEndpoints from '../config/spotify-api-endpoints'
import * as tokenRefresh from '../token-refresh'

const router: express.Router = express.Router()
const sampleState: string = 'sample-state123'
const userIdtokenMap = tokenRefresh.userIdtokenMap

router.use(cookieParser())
router.use(session(
    {
        secret: config.sessionSecret,
        name: 'djmarian-cookie',
        resave: true,
        saveUninitialized: true
    }
))

router.get('/callback', (req, res) => {
    let queryParams = req.query
    if (queryParams.error) {
        handleErrorAndSendErrorImage(queryParams.error, res)
        return
    }
    log.debug(`Authorization code: ${queryParams.code}`)
    requestAccessToken(queryParams.code)
    .then(tokenBody => {
        requestInfoAboutUserAndRedirect(tokenBody, req, res)        
    }).catch((err) => {
        handleErrorAndSendErrorImage(err, res)
    })
})

router.get('/checklogin', (req, res) => {
    
})

router.get('/login', (req, res) => {
    let redirect: string = `${spotifyEndpoints.spotifyAuthorizeEndpoints.authorize}\
?response_type=code\
&client_id=${config.clientId}\
&scope=${encodeURIComponent(config.scopes)}\
&redirect_uri=${encodeURIComponent(config.redirectUri)}\
&state=${encodeURIComponent(sampleState)}`
    log.debug(redirect)
    res.redirect(redirect)
})

function requestAccessToken(authorizationCode: string): requestPromise.RequestPromise {
    return requestPromise({
        url: `${spotifyEndpoints.spotifyAuthorizeEndpoints.token}`,
        form: {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: config.redirectUri
        },
        headers: {
            Authorization: `Basic ${config.encodedIdPair}`
        },
        method: 'POST'
    })
}

function requestInfoAboutUserAndRedirect(tokenBody: string, req: express.Request, res: express.Response): void {
    log.debug(`Received token body: ${tokenBody}`)
    let tokenJson = JSON.parse(tokenBody)
    let accessTokenJson: tokenRefresh.AccessTokenJson = tokenRefresh.AccessTokenJson.create(tokenJson)
    requestPromise({
        url: `${spotifyEndpoints.spotifyApiEndpoints.me}`,
        headers: {
            Authorization: `Bearer ${tokenJson.access_token}`
        },
        method: 'GET'
    })
    .then(userInfoBody => {
        log.debug(`User info body: ${userInfoBody}`)
        let userInfoJson: any = JSON.parse(userInfoBody)
        let userId: string = userInfoJson.id
        req.session.userId = userId
        userIdtokenMap.set(
            userId,
            accessTokenJson)
        res.redirect('/')
    })
}

function handleErrorAndSendErrorImage(err: Error, res: express.Response): void {
    log.error(`Error occured while performing callback: ${err}`)
    res.set('Content-Type', 'image/jpg')
    let dir: string = path.join(__dirname, '/../../public', '500.png')
    res.sendFile(dir)
}

export default router