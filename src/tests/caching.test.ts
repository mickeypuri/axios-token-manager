import axios from 'axios';
import nock from 'nock';
import { IToken, TokenProvider } from '../types';
import tokenManager from '../tokenManager';
import { getState } from '../state';

const baseURL = 'https://api.news.com';
const channelsPath = '/channel';
const channels = ['bbc', 'itv', 'netflix', 'prime'];

const ACCESS_TOKEN = 'token 1';

const token_one: IToken = { access_token: ACCESS_TOKEN,
    token_type: 'Bearer',
    expires_in: 300,
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
        const { access_token } = token as IToken

        expect (access_token).toEqual(ACCESS_TOKEN);
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
});
