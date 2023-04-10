import axios, { AxiosInstance } from 'axios';
import nock from 'nock';
import { IToken, TokenProvider } from '../types';
import { defaultSettings } from '../utils/initialValues';
import tokenManager from '../tokenManager';
import { getState } from '../state';

const baseURL = 'https://api.news.com';
const channelsPath = '/channel';
const channels = ['bbc', 'itv', 'netflix', 'prime'];

const token_one: IToken = { access_token: 'token 1',
    token_type: 'Bearer',
    expires_in: 300,
    scope: 'scope'
};

const token_two: IToken = { access_token: 'token 2',
    token_type: 'Bearer',
    expires_in: 300,
    scope: 'scope'
};

const getMockAxiosInstance = () => ({
    interceptors: {
        request: {
            use: jest.fn()
        },
        response: {
            use: jest.fn()
        }
    }
}) as unknown as AxiosInstance;

beforeAll(() => {
    nock(baseURL, {
        reqheaders: {
            "accept": "application/json, text/plain, */*",
            "authorization": "Bearer token 1",
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
        (getCredentials as jest.Mock).mockResolvedValueOnce(token_one);
        tokenManager({ instance, getCredentials });
        await instance.get(`${baseURL}${channelsPath}`);
        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
    });

    it('after start up it gets token in first call, then uses cached token for next four calls', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const instance = axios.create({ baseURL });
        (getCredentials as jest.Mock).mockResolvedValueOnce(token_one);
        tokenManager({ instance, getCredentials });

        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);
        await instance.get(`${baseURL}${channelsPath}`);

        expect((getCredentials as jest.Mock)).toBeCalledTimes(1);
    });


});
