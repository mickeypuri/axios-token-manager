import { AxiosError, AxiosHeaders, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import Semaphore from 'semaphore-async-await';
import { ITokenManager, IToken } from './types';
import { defaultSettings } from './utils/initialValues';
import { getFreshToken } from './utils/getFreshToken';
import { isTokenValid } from './utils/isTokenValid';
import { shouldRecover } from './utils/shouldRecover';
import { getToken } from './utils/getToken';
import { updateState, getState, setInitialState } from './state';

const lock = new Semaphore(1);
let _instance: AxiosInstance;

const requestInterceptor = async (config : InternalAxiosRequestConfig) => {
    const { options } = getState();
    const token = await getToken(lock);
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

const errorInterceptor = async (error: AxiosError) => {
    const needsToRecover = shouldRecover(error);

    if (needsToRecover) {
        await lock.acquire();
        const { cache, getCredentials } = getState();

        if (isTokenValid(cache)) {
            lock.release();
        } else {
            try {
                await getFreshToken(getCredentials);
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
        const { header, formatter, onRecoveryTry } = options;
        (config.headers as AxiosHeaders)[header] = formatter(access_token);
        onRecoveryTry();
        return _instance(config);
    } else {
        return Promise.reject(error);
    }
};

const tokenManager = (settings: ITokenManager) => {
    const { instance, getCredentials, ...rest} = settings;
    _instance = instance;
    const options = {...defaultSettings, ...rest };
    setInitialState(options, getCredentials);
    instance.interceptors.request.use(requestInterceptor);
    instance.interceptors.response.use(successInterceptor, errorInterceptor);
};

export default tokenManager;
