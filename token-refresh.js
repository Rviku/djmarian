const log = require('./logger')
const config = require('./config')
const requestPromise = require('request-promise');

const USER_ID_TOKEN_MAP = {}
const ENCODED_ID_PAIR = Buffer.from(
    `${config.clientId}:${config.clientSecret}`).toString('base64')

function refreshTokenAndWait(next) {
    log.debug('Checking if there are any tokens to refresh...')
    Object.keys(USER_ID_TOKEN_MAP).forEach((userId) => {
        log.info(`Refreshing token for userId: ${userId}`)
        requestPromise(getRefreshTokenRequestDataForUser)
            .then(newTokenBody => {
                updateCachedTokenForUser(newTokenBody, userId)
            }).catch(err => {
                logErrorForRefreshingToken(err)
            })
    })
    log.debug(`30s until next token refresh...`)
    setTimeout(() => next(), config.tokenRefreshIntervalMs)
}

function getRefreshTokenRequestDataForUser(userId) {
    return {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            grant_type: 'refresh_token',
            refresh_token: USER_ID_TOKEN_MAP[userId].refresh_token
        },
        headers: {
            Authorization: `Basic ${ENCODED_ID_PAIR}`
        },
        method: 'POST'
    }
}

function updateCachedTokenForUser(newTokenBody, userId) {
    USER_ID_TOKEN_MAP[userId].access_token = JSON.parse(newTokenBody).access_token
    log.debug(`New access token: ${USER_ID_TOKEN_MAP[userId].access_token}, for user: ${userId}`)
}

function logErrorForRefreshingToken(err) {
    log.error(`Error occured while refreshing token for user: ${userId}: ${err}`)
}

module.exports.refreshTokenAndWait = function(next) {
    refreshTokenAndWait(next)
}
module.exports.USER_ID_TOKEN_MAP = USER_ID_TOKEN_MAP