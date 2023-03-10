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
    tokenTryThreshold: 10,
    onTokenTryThreshold: noop,
    maxRecoveryTries: 5,
    onRecoveryAbort: noop
};