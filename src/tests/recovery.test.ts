import axios from 'axios';
import nock from 'nock';
import { IToken, TokenProvider, LogFunction } from '../types';
import tokenManager from '../tokenManager';
import { getState } from '../state';
import { defaultSettings } from '../utils/initialValues';

const baseURL = 'https://api.news.com';
const channelsPath = '/channel';
const schedulePath = '/schedule';
const channels = ['bbc', 'itv', 'netflix', 'prime'];
const schedules = ['sat', 'sun', 'mon', 'tue', 'wed'];

const ACCESS_TOKEN_ONE = 'Token One';
const ACCESS_TOKEN_TWO = 'Token Two';
const EXPIRES_IN_SECS = 300;

const token_one: IToken = { 
    access_token: ACCESS_TOKEN_ONE,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

const token_two: IToken = { 
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
        .reply(401);

    nock(baseURL, {
        reqheaders: {
            "accept": "application/json, text/plain, */*",
            "authorization": `Bearer ${ACCESS_TOKEN_TWO}`,
            "user-agent": "axios/1.3.4",
            "accept-encoding": "gzip, compress, deflate, br"
        }
    })
    .get(schedulePath)
    .times(4)
    .reply(200, { schedules });
});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});

describe('tokenManager caching', () => {

    it('on getting a 401 it tries to recover by getting another token and retries with the fresh token', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock)
            .mockResolvedValueOnce(token_one)
            .mockResolvedValueOnce(token_two);


        tokenManager({ instance, getCredentials });

        await instance.get(`${baseURL}${channelsPath}`);    // uses token 1
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        await instance.get(`${baseURL}${schedulePath}`);    // call will fail with a 401, we intercept the 401 and get another token, token 2, and retry with that
        await instance.get(`${baseURL}${schedulePath}`);
        await instance.get(`${baseURL}${schedulePath}`);
        await instance.get(`${baseURL}${schedulePath}`);


        expect((getCredentials as jest.Mock)).toBeCalledTimes(2);
    });

    it('on getting a 401 it tries to recover and get a fresh token and retry and calls the onRecoveryTry callback', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const onRecoveryTry: LogFunction = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock)
            .mockResolvedValueOnce(token_one)
            .mockResolvedValueOnce(token_two);


        tokenManager({ instance, getCredentials, onRecoveryTry });

        await instance.get(`${baseURL}${channelsPath}`);    // uses token 1
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        await instance.get(`${baseURL}${schedulePath}`);    // call will fail with a 401, we intercept the 401 and get another token, token 2, and retry with that
        await instance.get(`${baseURL}${schedulePath}`);
        await instance.get(`${baseURL}${schedulePath}`);
        await instance.get(`${baseURL}${schedulePath}`);

        expect((onRecoveryTry as jest.Mock)).toBeCalledTimes(1);
    });

});
