import { IToken, TokenProvider } from '../types';
import { defaultSettings } from '../utils/initialValues';
import tokenManager from '../tokenManager';
import axios, { AxiosInstance } from 'axios';
import { getState } from '../state';

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

const getCredentials: TokenProvider = jest.fn();

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

describe('tokenManager', () => {
    it('sets options to default settings if values not provided', () => {
        const instance = getMockAxiosInstance();
        tokenManager({ instance, getCredentials });
        const { options } = getState();
        expect(options).toEqual(defaultSettings);
    });
});