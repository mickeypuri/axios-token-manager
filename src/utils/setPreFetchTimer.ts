import { Token } from '../types';
import { preFetchToken } from './preFetchToken';
import { getState } from '../state';

export const setPreFetchTimer = (token : Token) => {
    const { options: { refreshBuffer } } = getState();
    const { access_token, expires_in } = token;
    const refreshPeriod = (expires_in - refreshBuffer) * 1000;
    setTimeout(preFetchToken, refreshPeriod, access_token);
};
