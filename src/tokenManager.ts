import { AxiosHeaders, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken, IDefaultSettings, TokenProvider, IConfig } from './types';
import { noop } from './utils/noop';

let cachedToken: IToken;
let options: IConfig;
let expiration: Number;
const lock = new Semaphore(1);

const defaultSettings: IDefaultSettings = {
    refreshBuffer: 10,
    header: 'Authorization',
    formatter: (access_token) => `Bearer ${access_token}`,
    onRefresh: noop,
    onAuthFail: noop
};

const getToken: TokenProvider  = async () => {
    if (isTokenValid()) {
        return Promise.resolve(cachedToken);
    }
    const credentials = await getFreshToken();
    return Promise.resolve(credentials);
};

const getFreshToken = async () : Promise<IToken> => {
    await lock.acquire();

    // check if a previous request updated the token while this request waited to acquire the lock
    if (isTokenValid()) {
        lock.release();
        return Promise.resolve(cachedToken);
    }

    const { getCredentials } = options;
    try {
        const credentials = await getCredentials();
        const {expires_in} = credentials;
        const {refreshBuffer} = options;
        const timeSpan = (expires_in - refreshBuffer) * 1000;
        cachedToken = credentials;
        expiration = Date.now() + timeSpan;
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
    if (!cachedToken) {
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

const tokenManager = (settings: ITokenManager) => {
    options = {...defaultSettings, ...settings } as IConfig;
    const { instance } = options;
    instance.interceptors.request.use(requestInterceptor);
};

export default tokenManager;