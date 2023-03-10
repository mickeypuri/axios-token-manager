import { ICache, IConfig } from '../types';
import { noop } from './noop';

export const initCache: ICache = {
    token: null,
    expiration: 0
};

export const defaultSettings: IConfig = {
    refreshBuffer: 10,
    header: 'Authorization',
    formatter: (access_token) => `Bearer ${access_token}`,
    onTokenRefresh: noop,
    onAuthFail: noop,
    onTokenRequestFail: noop,
    refreshOnStatus: [401],
    retryThreshold: 10,
    onRetryThreshold: noop,
    maxRecoveryTries: 5,
};