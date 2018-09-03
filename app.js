const express = require('express')
const log = require('./logger.js')
const path = require('path')
const session = require('express-session')

const HOSTNAME = '127.0.0.1'
const PORT = 3000
const MY_CLIENT_ID = '9aee663993e14e129c829ad6322c2ccc'
const SCOPES = 'user-read-private user-read-email'
const REDIRECT_URI = 'http://localhost:3000/callback'
const STATE = 'abcdfg123'
var server = express()
server.get('/test', (req, res) => {
    var query = req.query;
    log.debug(`Received ${query}`)
    res.send(`Query: ${query}!\n`)
})

server.get('/ping', (req, res) => {
    log.debug('Ping -> Pong!')
    res.send('Pong!')
})

server.get('/callback', (req, res) => {
    var queryParams = req.query
    log.debug(queryParams.code)
    log.debug(queryParams.state)
    res.redirect('/ping')
})

server.get('/checklogin', (req, res) => {
    
})

server.get('/login', (req, res) => {    
    res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + MY_CLIENT_ID +
    '&scope=' + encodeURIComponent(SCOPES) +
    '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
    '&state=' + encodeURIComponent(STATE))
})

server.get('*', (req, res) => {
    var dir = path.join(__dirname, 'public', 'index.html')
    res.sendFile(dir)
})

server.listen(PORT, HOSTNAME, () => {
  log.info(`Server running at http://${HOSTNAME}:${PORT}/`)
})
