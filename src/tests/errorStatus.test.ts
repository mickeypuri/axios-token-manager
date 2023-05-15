import axios, { AxiosError } from 'axios';
import nock from 'nock';
import { Token, TokenProvider, LogFunction } from '../types';
import tokenManager from '../tokenManager';
import { setPreFetchTimer } from '../utils/setPreFetchTimer';

jest.mock('../utils/setPreFetchTimer', () => ({
    setPreFetchTimer: jest.fn()
}));

const baseURL = 'https://api.news.com';
const channelsPath = '/channel';
const schedulePath = '/schedule';
const channels = ['bbc', 'itv', 'netflix', 'prime'];

const ACCESS_TOKEN_ONE = 'Token One';
const ACCESS_TOKEN_TWO = 'Token Two';
const EXPIRES_IN_SECS = 300;

const token_one: Token = { 
    access_token: ACCESS_TOKEN_ONE,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

const token_two: Token = { 
    access_token: ACCESS_TOKEN_TWO,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

beforeEach(() => {
    jest.resetAllMocks;

    nock(baseURL, {
        reqheaders: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${ACCESS_TOKEN_ONE}`,
            "user-agent": "axios/1.3.4",
            "accept-encoding": "gzip, compress, deflate, br"
        }
    })
        .get(channelsPath)
        .times(3)
        .reply(200, { channels })
        .get(schedulePath)
        .reply(500)
        .get(channelsPath)
        .reply(200, {channels});

});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});

describe('tokenManager caching', () => {

    it('on getting a status such as 500 which is not in the list of recovery status it will not try to recover and the request will fail', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const onTokenRefresh: LogFunction = jest.fn();
        const onAuthFail: LogFunction = jest.fn();
        const onRecoveryTry: LogFunction = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock)
            .mockResolvedValueOnce(token_one)
            .mockResolvedValueOnce(token_two);


        tokenManager({ instance, getCredentials, onRecoveryTry, onAuthFail, onTokenRefresh });

        await instance.get(`${baseURL}${channelsPath}`);    // uses token 1
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        // next call will fail with a 500, we intercept, see its not in our list to recover from, and allow the request to fail

        try {
            await instance.get(`${baseURL}${schedulePath}`);
        } catch (error) {
            const status = (error as AxiosError)?.response?.status;
            expect(status).toEqual(500);
        }

        await instance.get(`${baseURL}${channelsPath}`);

        expect((onAuthFail as jest.Mock)).toBeCalledTimes(0);
        expect((onRecoveryTry as jest.Mock)).toBeCalledTimes(0);

        expect((onTokenRefresh as jest.Mock)).toBeCalledTimes(1);
        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
        expect((setPreFetchTimer as jest.Mock)).toBeCalledTimes(1);
    });
});
