import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken, TokenProvider, IConfig, ICache, ITriesAccess, SetTries, GetTries, SetCache } from './types';
import { initCache, defaultSettings } from './utils/initialValues';
import { getFreshToken } from './utils/getFreshToken';
import { isTokenValid } from './utils/isTokenValid';
import { shouldRefresh } from './utils/shouldRefresh';

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

const successInterceptor = (response: AxiosResponse) => {
    if (inRefresh) {
        refreshTries = 0;
        inRefresh = false;
    }
    return response;
};

const shouldRefresh = (error: AxiosError) => {
    const { response } = error;
    if (!response) {
        return false;
    }
    const { status } = response;
    const { refreshOnStatus, maxRefreshTries } = options;
    const authFailed = refreshOnStatus.includes(status as number);

    if (authFailed && refreshTries < maxRefreshTries) {
        inRefresh = true;
        refreshTries++;
        return true;
    }

    if (authFailed && inRefresh && refreshTries >= maxRefreshTries) {
        inRefresh = false;
        refreshTries = 0;
    }

    return false;
};

const errorInterceptor = async (error: AxiosError) => {
    let needsToRefresh = shouldRefresh(error);

    if (needsToRefresh) {
        await lock.acquire();

        if (isTokenValid(cache)) {
            lock.release();
        } else {
            try {
                const credentials = await getFreshToken(options, triesAccess, setCache);
            }
            catch (error) {
                return Promise.reject(error);
            }
            finally {
                lock.release();
            }
        }
        const { response } = error;
        const { config } = response as AxiosResponse;
        const { token } = cache;
        const { access_token } = token as IToken;
        const { header, formatter, instance } = options;
        (config.headers as AxiosHeaders)[header] = formatter(access_token);
        return instance(config);
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