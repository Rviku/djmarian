const express = require('express')
const log = require('./logger')
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const request = require('request')
const config = require('./config')
const async = require("async")
var server = express()

const REDIRECT_URI = `http://${config.host}:${config.port}/callback`
const ENCODED_ID_PAIR = Buffer.from(
    `${config.clientId}:${config.clientSecret}`).toString('base64')
const SAMPLE_STATE = 'sample-state123'
const USER_ID_TOKEN_JSON_MAP = {}

server.use(cookieParser())
server.use(session(
    {
        secret: config.sessionSecret,
        name: 'djmarian-cookie',
        resave: true,
        saveUninitialized: true
    }
))

async.forever((next) => {
    log.debug('Checking if there are any tokens to refresh...')
    Object.keys(USER_ID_TOKEN_JSON_MAP).forEach((userId) => {
        log.info(`Refreshing token for userId: ${userId}`)
        async.waterfall([
            (callback) => {
                request.post({
                    url: 'https://accounts.spotify.com/api/token',
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: USER_ID_TOKEN_JSON_MAP[userId].refresh_token
                    },
                    headers: {
                        Authorization: `Basic ${ENCODED_ID_PAIR}`
                    }
                }, (err, httpResponse, body) => callback(err, body))
            },
            (body) => {
                USER_ID_TOKEN_JSON_MAP[userId].access_token = JSON.parse(body).access_token
                log.debug(USER_ID_TOKEN_JSON_MAP[userId].access_token)
        }], (err) => log.error(err))
    })
    log.debug(`30s until next token refresh...`)
    setTimeout(() => next(), 30000)
})

server.get('/ping', (req, res) => {
    log.debug('Ping -> Pong!')
    res.send('Pong!')
})

async.waterfall([
    (callback) => {
        server.get('/callback', (req, res) => {
            var queryParams = req.query
            var authorizationCode = queryParams.code
            log.debug(authorizationCode)
            log.debug(queryParams.state)
            log.debug(queryParams.error)
            log.debug(ENCODED_ID_PAIR)
            callback(null, authorizationCode, req, res)
        })
    },
    (authorizationCode, req, res, callback) => {
        request.post(
            {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    grant_type: 'authorization_code',
                    code: authorizationCode,
                    redirect_uri: REDIRECT_URI
                },
                headers: {
                    Authorization: `Basic ${ENCODED_ID_PAIR}`
                }
            },
            (err, httpResponse, body) => callback(err, body, req, res)
        )
    },
    (body, req, res, callback) => {
        var tokenJson = JSON.parse(body)
        log.debug(tokenJson.access_token)
        log.debug(tokenJson.token_type)
        log.debug(tokenJson.scope)
        log.debug(tokenJson.expires_in)
        log.debug(tokenJson.refresh_token)
        callback(null, tokenJson, req, res)
    },
    (tokenJson, req, res, callback) => {
        request.get(
            {
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    Authorization: `Bearer ${tokenJson.access_token}`
                }
            },
            (err, httpResponse, body) => callback(err, body, req, res, tokenJson)
        )
    },
    (body, req, res, tokenJson) => {
        log.debug(body)
        var selfInfoJson = JSON.parse(body)
        log.debug(selfInfoJson.id)
        req.session.userId = selfInfoJson.id
        USER_ID_TOKEN_JSON_MAP[selfInfoJson.id] = tokenJson
        res.redirect('/')
    }
], (err) => log.error(err))

server.get('/checklogin', (req, res) => {
    
})

server.get('/login', (req, res) => {
    var redirect = `https://accounts.spotify.com/authorize\
?response_type=code\
&client_id=${config.clientId}\
&scope=${encodeURIComponent(config.scopes)}\
&redirect_uri=${encodeURIComponent(config.redirectUri)}\
&state=${encodeURIComponent(SAMPLE_STATE)}`
    log.debug(redirect)
    res.redirect(redirect)
})

server.get('/', (req, res) => {
    if (req.session.userId ||
         USER_ID_TOKEN_JSON_MAP[req.session.userId]) {
        
        var dir = path.join(__dirname, 'public', 'index.html')
        res.sendFile(dir)
    } else {
        res.redirect('/login')
    }
})

server.listen(config.port, config.host, () => {
  log.info(`Server running at http://${config.host}:${config.port}/`)
})
