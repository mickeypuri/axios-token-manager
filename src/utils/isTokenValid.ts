import { ICache } from '../types';

export const isTokenValid = (cache: ICache) => {
    const { token, expiration } = cache;
    if (!token) {
        return false;
    }
    return expiration > Date.now();
};
