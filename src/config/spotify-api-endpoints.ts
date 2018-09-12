//This config purpose is mainly for unit tests

abstract class SpotifyEndpoints {
}

class SpotifyApiEndpoints extends SpotifyEndpoints {
    private constructor(
        public me: string
    ) {
        super()
    }
    static get(root: string = 'https://api.spotify.com/v1/'): SpotifyApiEndpoints {
        return new SpotifyApiEndpoints(
            `${root}me`
        )
    }
}

class SpotifyAuthorizeEndpoints extends SpotifyEndpoints {
    private constructor(
        public token: string,
        public authorize: string
    ) {
        super()
    }
    static get(root: string = 'https://accounts.spotify.com/'): SpotifyAuthorizeEndpoints {
        return new SpotifyAuthorizeEndpoints(
            `${root}api/token`,
            `${root}authorize`
        )
    }
}

const spotifyAuthorizeEndpoints: SpotifyAuthorizeEndpoints = SpotifyAuthorizeEndpoints.get()
const spotifyApiEndpoints: SpotifyApiEndpoints = SpotifyApiEndpoints.get()

export { spotifyAuthorizeEndpoints, spotifyApiEndpoints }