const express = require('express')
const log = require('./logger')
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const requestPromise = require('request-promise');
const config = require('./config')
const tokenRefresh = require('./token-refresh')
const async = require('async')

const server = express()

const REDIRECT_URI = `http://${config.host}:${config.port}/callback`
const ENCODED_ID_PAIR = Buffer.from(
    `${config.clientId}:${config.clientSecret}`).toString('base64')
const SAMPLE_STATE = 'sample-state123'
const USER_ID_TOKEN_JSON_MAP = tokenRefresh.USER_ID_TOKEN_MAP

function initCookies() {
    server.use(cookieParser())
    server.use(session(
        {
            secret: config.sessionSecret,
            name: 'djmarian-cookie',
            resave: true,
            saveUninitialized: true
        }
    ))
}

initCookies()

async.forever(next => {
    tokenRefresh.refreshTokenAndWait(next)
})

server.get('/ping', (req, res) => {
    log.debug('Ping -> Pong!')
    res.send('Pong!')
})

server.get('/callback', (req, res) => {
    let queryParams = req.query
    let authorizationCode = queryParams.code
    log.debug(`Authorization code: ${authorizationCode}`)
    requestPromise({
        url: 'https://accounts.spotify.com/api/token',
        form: {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: REDIRECT_URI
        },
        headers: {
            Authorization: `Basic ${ENCODED_ID_PAIR}`
        },
        method: 'POST'
    }).then(tokenBody => {
        log.debug(`Received token body: ${tokenBody}`)
        return JSON.parse(tokenBody)
    }).then(tokenJson => {
        requestPromise({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                Authorization: `Bearer ${tokenJson.access_token}`
            },
            method: 'GET'
        })
        .then(userInfoBody => {
            log.debug(`User info body: ${userInfoBody}`)
            let userInfoJson = JSON.parse(userInfoBody)
            req.session.userId = userInfoJson.id
            USER_ID_TOKEN_JSON_MAP[userInfoJson.id] = tokenJson
            res.redirect('/')
        })
        .catchThrow(err => {
            throw err
        })
    }).catch((err) => {
        log.error(`Error occured while performing callback${err}`)
        res.set('Content-Type', 'image/jpg')
        let dir = path.join(__dirname, 'public', '500.png')
        res.sendFile(dir)
    })
})

server.get('/checklogin', (req, res) => {
    
})

server.get('/login', (req, res) => {
    let redirect = `https://accounts.spotify.com/authorize\
?response_type=code\
&client_id=${config.clientId}\
&scope=${encodeURIComponent(config.scopes)}\
&redirect_uri=${encodeURIComponent(config.redirectUri)}\
&state=${encodeURIComponent(SAMPLE_STATE)}`
    log.debug(redirect)
    res.redirect(redirect)
})

server.get('/', (req, res) => {
    try {
        log.debug(`Received new main page request from IP: ${req.ip} - Cookie: ${req.cookies['djmarian-cookie']}`)
        if (req.session.userId ||
            USER_ID_TOKEN_JSON_MAP[req.session.userId]) {
            
            let dir = path.join(__dirname, 'public', 'index.html')
            res.sendFile(dir)
        } else {
            res.redirect('/login')
        }
    } catch (err) {
        log.error(`Problem has occurred while requesting for main page: ${err}`)
        res.set('Content-Type', 'image/jpg')
        let dir = path.join(__dirname, 'public', '500.png')
        res.sendFile(dir)
    }
})

server.listen(config.port, config.host, () => {
  log.info(`Server running at http://${config.host}:${config.port}/`)
})
