import { TokenProvider } from '../types';
import { defaultSettings } from '../utils/initialValues';
import tokenManager from '../tokenManager';
import { AxiosInstance } from 'axios';
import { getState } from '../state';

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

describe('tokenManager initialisation', () => {
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

    it('is set up to intercept all requests', () => {
        const instance = getMockAxiosInstance();
        tokenManager({ instance, getCredentials });
        const { interceptors : { request : { use : requestInterceptMock }}} = instance;
        expect((requestInterceptMock as jest.Mock)).toBeCalledTimes(1);
    });

    it('is set up to intercept all responses', () => {
        const instance = getMockAxiosInstance();
        tokenManager({ instance, getCredentials });
        const { interceptors : { response : { use : responseInterceptMock }}} = instance;
        expect((responseInterceptMock as jest.Mock)).toBeCalledTimes(1);
    });

    it('will not invoke getCredentials at initialisation', () => {
        const instance = getMockAxiosInstance();
        tokenManager({ instance, getCredentials });
        expect((getCredentials as jest.Mock)).not.toBeCalled();
    });
});
