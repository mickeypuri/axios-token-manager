import { AxiosError, AxiosHeaders, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken, TokenProvider } from './types';
import { defaultSettings } from './utils/initialValues';
import { getFreshToken } from './utils/getFreshToken';
import { isTokenValid } from './utils/isTokenValid';
import { updateState, getState, setInitialState } from './state';

const lock = new Semaphore(1);
let _instance: AxiosInstance;
let _getCredentials: TokenProvider;

const getToken: TokenProvider  = async () => {
    const { cache } = getState();
    if (isTokenValid(cache)) {
        const { token } = cache;
        return Promise.resolve(token as IToken);
    }

    await lock.acquire();

    // check if previous request updated token while this request waited
    if (isTokenValid(cache)) {
        lock.release();
        const { token } = cache;
        return Promise.resolve(token as IToken);
    }

    try {
        const credentials = await getFreshToken(_getCredentials);
        return Promise.resolve(credentials);
    } 
    catch (error) {
        return Promise.reject(error);
    } 
    finally {
        lock.release();
    }
};

const requestInterceptor = async (config : InternalAxiosRequestConfig) => {
    const { options } = getState();
    const token = await getToken();
    const { access_token } = token;
    const { header, formatter } = options;
    (config.headers as AxiosHeaders)[header] = formatter(access_token);
    return config;
};

const successInterceptor = (response: AxiosResponse) => {
    const { inRecovery } = getState();
    if (inRecovery) {
        updateState({
            recoveryTries: 0,
            inRecovery: false
        });
    }
    return response;
};

const shouldRefresh = (error: AxiosError) => {
    const { options, recoveryTries, inRecovery } = getState();
    const { response } = error;
    if (!response) {
        return false;
    }
    const { status } = response;
    const { refreshOnStatus, maxRefreshTries } = options;
    const authFailed = refreshOnStatus.includes(status as number);

    if (authFailed && recoveryTries < maxRefreshTries) {
        updateState({
            inRecovery: true,
            recoveryTries: recoveryTries + 1
        });
        return true;
    }

    if (authFailed && inRecovery && recoveryTries >= maxRefreshTries) {
        updateState({
            inRecovery: false,
            recoveryTries: 0
        });
    }

    return false;
};

const errorInterceptor = async (error: AxiosError) => {
    const needsToRefresh = shouldRefresh(error);

    if (needsToRefresh) {
        await lock.acquire();
        const { cache } = getState();

        if (isTokenValid(cache)) {
            lock.release();
        } else {
            try {
                await getFreshToken(_getCredentials);
            }
            catch (error) {
                return Promise.reject(error);
            }
            finally {
                lock.release();
            }
        }
        const { options } = getState();
        const { response } = error;
        const { config } = response as AxiosResponse;
        const { token } = cache;
        const { access_token } = token as IToken;
        const { header, formatter } = options;
        (config.headers as AxiosHeaders)[header] = formatter(access_token);
        return _instance(config);
    } else {
        return Promise.reject(error);
    }
};

const tokenManager = (settings: ITokenManager) => {
    const { instance, getCredentials, ...rest} = settings;
    _instance = instance;
    _getCredentials = getCredentials;
    const options = {...defaultSettings, ...rest };
    setInitialState(options);
    instance.interceptors.request.use(requestInterceptor);
    instance.interceptors.response.use(successInterceptor, errorInterceptor);
};

export default tokenManager;