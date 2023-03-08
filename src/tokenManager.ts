import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken, TokenProvider, IConfig, ICache, ITriesAccess, SetTries, GetTries, SetCache } from './types';
import { initCache, defaultSettings } from './utils/initialValues';
import { getFreshToken } from './utils/getFreshToken';
import { isTokenValid } from './utils/isTokenValid';

let cache: ICache = initCache;
let options: IConfig;
const lock = new Semaphore(1);
let retries = 0;
let refreshTries = 0;
let inRefresh = false;

const setTries: SetTries = (tries: number) => refreshTries = tries;
const getTries: GetTries = () => retries;
const triesAccess: ITriesAccess = {
    setTries,
    getTries
};
const setCache: SetCache = (value: ICache) => cache = value;

const getToken: TokenProvider  = async () => {
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
        const credentials = await getFreshToken(options, triesAccess, setCache);
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
    const token = await getToken();
    const { access_token } = token;
    const { header, formatter } = options;
    (config.headers as AxiosHeaders)[header] = formatter(access_token);
    return config;
};

const shouldRefresh = (error: AxiosError) => {
    const { response: { status } = {} } = error;
    const { refreshOnStatus, maxRefreshTries } = options;
    const authFailed = refreshOnStatus.includes(status as number);
    return authFailed && ( refreshTries < maxRefreshTries );
};

const successInterceptor = (response: AxiosResponse) => {
    if (inRefresh) {
        refreshTries = 0;
        inRefresh = false;
    }
    return response;
};

const errorInterceptor = async (error: AxiosError) => {
    const needsToRefresh = shouldRefresh(error);
    if (needsToRefresh) {
        await lock.acquire();

        if (isTokenValid(cache)) {
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
                const credentials = await getFreshToken(options, triesAccess, setCache);
                const { response : { config } = {}} = error;
                if (config) {
                    const { token } = cache;
                    const { access_token } = token as IToken;
                    const { header, formatter, instance } = options;
                    (config.headers as AxiosHeaders)[header] = formatter(access_token);
                    return instance(config);
                } else {
                    inRefresh = false;
                    refreshTries = 0;
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