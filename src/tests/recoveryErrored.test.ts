import axios, { AxiosError, AxiosResponse } from 'axios';
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
const EXPIRES_IN_SECS = 300;

const token_one: Token = { 
    access_token: ACCESS_TOKEN_ONE,
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
        .reply(401);
});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});

describe('tokenManager caching', () => {

    it('on getting a 401 it tries to recover but if the call to get the fresh token fails then it rejects the request', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const onTokenRefresh: LogFunction = jest.fn();
        const onAuthFail: LogFunction = jest.fn();
        const onRecoveryTry: LogFunction = jest.fn();
        const instance = axios.create({ baseURL });
        const errorResponse = {data: 'some data', status: 500} as AxiosResponse;
        (getCredentials as jest.Mock)
            .mockResolvedValueOnce(token_one)
            .mockRejectedValueOnce(new AxiosError('recovery failed', undefined, undefined, undefined, errorResponse));

        tokenManager({ instance, getCredentials, onRecoveryTry, onAuthFail, onTokenRefresh });

        await instance.get(`${baseURL}${channelsPath}`);    // uses token 1
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        // call will fail with a 401, we intercept the 401 and try get another token but it errors and returns a 500 status
        // as second attempt to get token fails, we will not call setPreFetchTimer again
        try {
            await instance.get(`${baseURL}${schedulePath}`); 
        } catch (error) {
            expect((error as AxiosError)?.response?.status).toEqual(500);
        }
        
        expect((onAuthFail as jest.Mock)).toBeCalledTimes(1);
        expect((onRecoveryTry as jest.Mock)).toBeCalledTimes(0);
        expect((onTokenRefresh as jest.Mock)).toBeCalledTimes(1);
        expect((getCredentials as jest.Mock)).toBeCalledTimes(2);
        expect((setPreFetchTimer as jest.Mock)).toBeCalledTimes(1);
    });
});
