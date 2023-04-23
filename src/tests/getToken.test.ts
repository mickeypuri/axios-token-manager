import { getToken } from '../utils/getToken';
import { getState } from '../state';
import { TokenProvider } from '../types';
import Semaphore from 'semaphore-async-await';

const ACCESS_TOKEN_ONE = 'Token One';
const ACCESS_TOKEN_TWO = 'Token Two';
const EXPIRES_IN_SECS = 300;

const expiredToken = { 
    access_token: ACCESS_TOKEN_ONE,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

const expiredCache = {
    token: expiredToken,
    expiration: Date.now() - 10000
};

const validToken = { 
    access_token: ACCESS_TOKEN_TWO,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'scope'
};

const validCache = {
    token: validToken,
    expiration: Date.now() + 10000
};

jest.mock('../state');

describe.only ('getToken', () => {
    it('will not get a fresh token if the previous request has already updated the token', async () => {
        const getCredentials: TokenProvider = jest.fn();
        const lock = {
            acquire: jest.fn().mockResolvedValueOnce(''),
            release: jest.fn()
        } as unknown as Semaphore;

        (getState as jest.Mock)
            .mockReturnValueOnce({
                cache: expiredCache,
                getCredentials
            })
            .mockReturnValueOnce({
                cache: validCache,
                getCredentials
            });
        
        const token = await getToken(lock);

        expect((lock.acquire as jest.Mock)).toBeCalledTimes(1);
        expect((lock.release as jest.Mock)).toBeCalledTimes(1);
        expect((getCredentials as jest.Mock)).not.toBeCalled();
        expect(token).toEqual(validToken);
    });
});
