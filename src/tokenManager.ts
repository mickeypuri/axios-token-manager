import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken, IDefaultSettings, TokenProvider, IConfig, ICache } from './types';
import { initCache, defaultSettings } from './utils/initialValues';

let cache: ICache = initCache;
let options: IConfig;
const lock = new Semaphore(1);
let retries = 0;
let refreshTries = 0;
let inRefresh = false;

const getToken: TokenProvider  = async () => {
    if (isTokenValid()) {
        const { token } = cache;
        return Promise.resolve(token as IToken);
    }

    await lock.acquire();

    // check if previous request updated token while this request waited
    if (isTokenValid()) {
        lock.release();
        const { token } = cache;
        return Promise.resolve(token as IToken);
    }

    try {
        const credentials = await getFreshToken();
        return Promise.resolve(credentials);
    } 
    catch (error) {
        return Promise.reject(error);
    } 
    finally {
        lock.release();
    }
};

const isTokenValid = () => {
    const { token, expiration } = cache;
    if (!token) {
        return false;
    }
    return expiration > Date.now();
};

const requestInterceptor = async (config : InternalAxiosRequestConfig) => {
    const token = await getToken();
    const { access_token } = token;
    const { header, formatter } = options;
    (config.headers as AxiosHeaders)[header] = formatter(access_token);
    return config;
};

const isAuthFailure = (error: AxiosError) => {
    const { response: { status } = {} } = error;
    const { refreshOnStatus } = options;
    return refreshOnStatus.includes(status as number);
};

const successInterceptor = (response: AxiosResponse) => {
    if (inRefresh) {
        refreshTries = 0;
        inRefresh = false;
    }
    return response;
};

const errorInterceptor = async (error: AxiosError) => {
    const authFailed = isAuthFailure(error);
    if (authFailed) {
        await lock.acquire();

        if (isTokenValid()) {
            lock.release();
            const { response : { config } = {}} = error;
            if (config) {
                const { token } = cache;
                const { access_token } = token as IToken;
                const { header, formatter, instance } = options;
                (config.headers as AxiosHeaders)[header] = formatter(access_token);
                return instance(config);
            } else {
                return Promise.reject(error);
            }
        } else {
            try {
                const credentials = await getFreshToken();
                const { response : { config } = {}} = error;
                if (config) {
                    const { token } = cache;
                    const { access_token } = token as IToken;
                    const { header, formatter, instance } = options;
                    (config.headers as AxiosHeaders)[header] = formatter(access_token);
                    return instance(config);
                } else {
                    return Promise.reject(error);
                }
            } 
            catch (error) {
                return Promise.reject(error);
            } 
            finally {
                lock.release();
            }
            
        }
    } else {
        return Promise.reject(error);
    }
};

const tokenManager = (settings: ITokenManager) => {
    options = {...defaultSettings, ...settings } as IConfig;
    const { instance } = options;
    instance.interceptors.request.use(requestInterceptor);
    instance.interceptors.response.use(successInterceptor, errorInterceptor);
};

export default tokenManager;