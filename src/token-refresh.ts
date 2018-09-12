import log from './logger'
import config from './config/config'
import * as requestPromise from 'request-promise'
import * as async from 'async'
import * as spotifyEndpoints from './config/spotify-api-endpoints'

class AccessTokenJson {
    private constructor(
        public access_token: string,
        public token_type: string,
        public scope: string,
        public expires_in: number,
        public refresh_token: string
    ) {}
    public static create(json: AccessTokenJson): AccessTokenJson {
        return new AccessTokenJson(
            json.access_token,
            json.token_type,
            json.scope,
            json.expires_in,
            json.refresh_token
        )
    }
    public toString(): string {
        return JSON.stringify(this)
    }
}
const userIdtokenMap = new Map<string, AccessTokenJson>();

function refreshTokenInLoop(): void {
    async.forever(next => {
        log.debug('Checking if there are any tokens to refresh...')
        userIdtokenMap.forEach((accessTokenJson: AccessTokenJson, userId: string) => {
            log.info(`Refreshing token for userId: ${userId}`)
            log.debug(`Access token for userId: ${userId} - ${accessTokenJson.toString()}`)
            requestPromise(getRefreshTokenRequestDataForUser(userId))
                .then((newTokenBody: string) => {
                    updateCachedTokenForUser(newTokenBody, userId)
                }).catch(err => {
                    logErrorForRefreshingToken(err, userId)
                })
        })
        log.debug(`30s until next token refresh...`)
        setTimeout(() => next(), config.tokenRefreshIntervalMs)
    }, err => {
        throw err
    })    
}

function getRefreshTokenRequestDataForUser(userId: string): requestPromise.Options {
    let refreshToken: AccessTokenJson = userIdtokenMap.get(userId)
    log.debug(refreshToken)
    return {
        url: `${spotifyEndpoints.spotifyAuthorizeEndpoints.token}`,
        form: {
            grant_type: 'refresh_token',
            refresh_token: userIdtokenMap.get(userId).refresh_token
        },
        headers: {
            Authorization: `Basic ${config.encodedIdPair}`
        },
        method: 'POST'
    }
}

function updateCachedTokenForUser(newTokenBody: string, userId: string) {
    userIdtokenMap.get(userId).access_token = JSON.parse(newTokenBody).access_token
    log.debug(`New access token: ${userIdtokenMap.get(userId).access_token}, for user: ${userId}`)
}

function logErrorForRefreshingToken(err, userId): void {
    log.error(`Error occured while refreshing token for user: ${userId}: ${err}`)
}

export { userIdtokenMap, refreshTokenInLoop, AccessTokenJson }