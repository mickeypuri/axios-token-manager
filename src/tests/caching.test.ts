import axios from 'axios';
import nock from 'nock';
import { Token, TokenProvider, LogFunction } from '../types';
import tokenManager from '../tokenManager';
import { getState } from '../state';
import { defaultSettings } from '../utils/initialValues';

const baseURL = 'https://api.news.com';
const channelsPath = '/channel';
const channels = ['bbc', 'itv', 'netflix', 'prime'];

const ACCESS_TOKEN = 'token 1';
const EXPIRES_IN_SECS = 300;

const token_one: Token = { 
    access_token: ACCESS_TOKEN,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

beforeAll(() => {
    nock(baseURL, {
        reqheaders: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${ACCESS_TOKEN}`,
            "user-agent": "axios/1.3.4",
            "accept-encoding": "gzip, compress, deflate, br"
        }
    })
        .get(channelsPath)
        .reply(200, { channels })
        .persist();
});

beforeEach(() => {
    jest.resetAllMocks;
});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});

describe('tokenManager caching', () => {

    it('calls for a Token when it gets a request and no token exists', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValue(token_one);
        tokenManager({ instance, getCredentials });
        await instance.get(`${baseURL}${channelsPath}`);
        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
    });

    it('caches the Token after getting it', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValue(token_one);
        tokenManager({ instance, getCredentials });
        await instance.get(`${baseURL}${channelsPath}`);

        const { cache: { token } } = getState();
        const { access_token } = token as Token

        expect (access_token).toEqual(ACCESS_TOKEN);
    });

    it('sets the cache expiration after getting the token', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        const { refreshBuffer } = defaultSettings;
        (getCredentials as jest.Mock).mockResolvedValue(token_one);
        tokenManager({ instance, getCredentials });
        await instance.get(`${baseURL}${channelsPath}`);

        const expectedExpiry = Date.now() + (EXPIRES_IN_SECS - refreshBuffer) * 1000;
        const { cache : { expiration }} = getState();

        const expectedExpirySecs = Math.round(expectedExpiry/1000);
        const actualExpirySecs = Math.round(expiration/1000);

        expect(actualExpirySecs).toEqual(expectedExpirySecs);
    });

    it('after start up it gets token in first call, then uses cached token for next four calls', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValue(token_one);
        tokenManager({ instance, getCredentials });

        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
    });

    it('after getting a token, it uses cached token for next four simultaneous calls', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValue(token_one);
        tokenManager({ instance, getCredentials });

        await instance.get(`${baseURL}${channelsPath}`);
        await Promise.all([
            instance.get(`${baseURL}${channelsPath}`),
            instance.get(`${baseURL}${channelsPath}`),
            instance.get(`${baseURL}${channelsPath}`),
            instance.get(`${baseURL}${channelsPath}`)
        ]);

        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
    });

    it('when the expiry time of cached token has passed it makes a call for a new token and calls the onTokenRefresh callback', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const onTokenRefresh: LogFunction = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValue(token_one);

        tokenManager({ instance, getCredentials, onTokenRefresh });

        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        // move time forward by 500 seconds
        const currentTime = Date.now();
        jest.spyOn(global.Date, 'now').mockImplementation(() => currentTime + 500000);

        await instance.get(`${baseURL}${channelsPath}`);

        expect((getCredentials as jest.Mock)).toBeCalledTimes(2);
        expect((onTokenRefresh as jest.Mock)).toBeCalledTimes(2);
    });

    it('further testing that when expiry time of cached token has passed it makes a call for a new token', async () => {
        const getCredentials: TokenProvider = jest.fn();
        (getCredentials as jest.Mock).mockResolvedValue(token_one);

        let timePassed = 0;
        const currentTime = Date.now();
        jest.spyOn(global.Date, 'now').mockImplementation(() => currentTime + timePassed);

        const instance = axios.create({ baseURL });
        tokenManager({ instance, getCredentials });

        await instance.get(`${baseURL}${channelsPath}`);    // gets first token with 300 sec expiry
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        timePassed = 500000;   // move time forward by 500 seconds

        await instance.get(`${baseURL}${channelsPath}`);    // gets a new token
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        timePassed = 1000000;

        await instance.get(`${baseURL}${channelsPath}`);    // gets another new token
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);     

        expect((getCredentials as jest.Mock)).toBeCalledTimes(3);
    });
});
