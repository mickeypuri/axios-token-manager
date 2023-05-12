import { Cache } from '../types';

export const isTokenValid = (cache: Cache) => {
    const { token, expiration } = cache;
    if (!token) {
        return false;
    }
    return expiration > Date.now();
};
