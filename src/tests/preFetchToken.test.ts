import { Token } from '../types';
import { getState } from '../state';
import { getFreshToken } from '../utils/getFreshToken';
import { defaultSettings } from '../utils/initialValues';

import { preFetchToken } from '../utils/preFetchToken';

jest.mock('../state');

jest.mock('../utils/getFreshToken', () => ({
    getFreshToken: jest.fn()
}));

const EXPIRES_IN_SECS = 3600;
const ACCESS_TOKEN_ONE = 'Token One';
const ACCESS_TOKEN_TWO = 'Token Two';
const EXPIRATION = Date.now() + EXPIRES_IN_SECS * 1000;
const EXPIRED = Date.now() - 5000;

const token: Token = {
    access_token: ACCESS_TOKEN_ONE,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'site wide'
};

describe('preFetchToken', () => {

    it('does not get a fresh token if Token is no longer valid', async () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: EXPIRED },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));

        await preFetchToken(ACCESS_TOKEN_ONE);
        expect((getFreshToken as jest.Mock)).not.toBeCalled();
    });

    it('does not get a fresh token if Token has changed since timer started', async () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: EXPIRATION },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));

        await preFetchToken(ACCESS_TOKEN_TWO);
        expect((getFreshToken as jest.Mock)).not.toBeCalled();
    });

    it('will get a fresh token if token is valid and is the same as when timer started', async () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: EXPIRATION },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));

        await preFetchToken(ACCESS_TOKEN_ONE);
        expect((getFreshToken as jest.Mock)).toBeCalledTimes(1);
    });

    it('will return an error if the request for a fresh token fails', async () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: EXPIRATION },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));

        const ERROR = new Error('Token Refresh Failed');
        (getFreshToken as jest.Mock).mockRejectedValueOnce(ERROR);

        try {
            await preFetchToken(ACCESS_TOKEN_ONE);
        } catch (error) {
            expect(error).toEqual(ERROR);
        }
    });
});
