import axios from 'axios';
import nock from 'nock';
import { IToken, TokenProvider, LogFunction } from '../types';
import tokenManager from '../tokenManager';

// This mocks the shouldRecover function, and forces it to recover when there is an error
// As shouldRecover is mocked, it skips resetting the cache in this test. 
// So the cache and token remains valid, which simulates the situation that a previous request has got a new token 
// and has cached it and hence the cache and token are valid

jest.mock('../utils/shouldRecover', () => ({
    shouldRecover: () => true
}));

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
        .reply(401)
        .get(schedulePath)
        .times(3)
        .reply(200, {schedules});

});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
    jest.restoreAllMocks();
});

describe('tokenManager caching', () => {

    it('on getting a 401, if previous failed auth call has fetched a new token then it uses that and will not get a further token', async () => {

        const getCredentials: TokenProvider = jest.fn();

        const onTokenRefresh: LogFunction = jest.fn();
        const onRecoveryTry: LogFunction = jest.fn();

        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock)
            .mockResolvedValueOnce(token_one)
            .mockResolvedValueOnce(token_two);


        tokenManager({ instance, getCredentials, onRecoveryTry, onTokenRefresh });

        await instance.get(`${baseURL}${channelsPath}`);    // uses token 1
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        await instance.get(`${baseURL}${schedulePath}`);    // call will fail with a 401, we intercept the 401

        await instance.get(`${baseURL}${schedulePath}`);
        await instance.get(`${baseURL}${schedulePath}`);

        expect((onRecoveryTry as jest.Mock)).toBeCalledTimes(1);    // tries to recover the failed call
        expect((onTokenRefresh as jest.Mock)).toBeCalledTimes(1);   // does not call for a further token refresh as Token was still valid
        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);   // does not call for a token again as the Token was still valid
    });
});
