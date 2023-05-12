import { Token } from '../types';
import Semaphore from 'semaphore-async-await';
import { getState } from '../state';
import { isTokenValid } from './isTokenValid';
import { getFreshToken } from './getFreshToken';

export const getToken  = async (lock : Semaphore) => {
    const { cache, getCredentials } = getState();
    if (isTokenValid(cache)) {
        const { token } = cache;
        return Promise.resolve(token as Token);
    }

    await lock.acquire();

    // check if previous request updated token while this request waited
    const { cache: currentCache } = getState();
    if (isTokenValid(currentCache)) {
        lock.release();
        const { token } = currentCache;
        return Promise.resolve(token as Token);
    }

    try {
        const credentials = await getFreshToken(getCredentials);
        return Promise.resolve(credentials);
    } 
    catch (error) {
        return Promise.reject(error);
    } 
    finally {
        lock.release();
    }
};
