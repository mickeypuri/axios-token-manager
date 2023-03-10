import { IToken } from '../types';
import Semaphore from 'semaphore-async-await';
import { getState } from '../state';
import { isTokenValid } from './isTokenValid';
import { getFreshToken } from './getFreshToken';

export const getToken  = async (lock : Semaphore) => {
    const { cache, getCredentials } = getState();
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
