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
    describe('initialisation', () => {
        it('sets options to default settings if values not provided', () => {
            const instance = getMockAxiosInstance();
            tokenManager({ instance, getCredentials });
            const { options } = getState();
            expect(options).toEqual(defaultSettings);
        });

        it('sets rest of options to default settings and uses two options provided', () => {
            const instance = getMockAxiosInstance();

            const maxRecoveryTries = 10;
            const onAuthFail = () => console.log('Authorisation has failed');
            const expectedOptions = {...defaultSettings, maxRecoveryTries, onAuthFail };

            tokenManager({ instance, getCredentials, maxRecoveryTries, onAuthFail });
            const { options } = getState();
            expect(options).toEqual(expectedOptions);
        });

        it('sets rest of options to default settings and uses the three options provided', () => {
            const instance = getMockAxiosInstance();

            const tokenTryThreshold = 10;
            const onTokenRefresh = () => console.log('Authorisation has failed');
            const header = 'Test Header';
            const expectedOptions = {...defaultSettings, tokenTryThreshold, onTokenRefresh, header };

            tokenManager({ instance, getCredentials, tokenTryThreshold, onTokenRefresh, header });
            const { options } = getState();
            expect(options).toEqual(expectedOptions);
        });     
    });
});