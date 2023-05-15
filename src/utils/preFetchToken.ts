import { Token } from '../types';
import { getState } from '../state';
import { isTokenValid } from './isTokenValid';
import { getFreshToken } from './getFreshToken';

const isSameToken = (accessToken: string) => {
    const { cache } = getState();
    if (isTokenValid(cache)) {
        const { token } = cache;
        const { access_token } = token as Token;
        if (access_token === accessToken) {
            return true;
        }
    }
    return false;
};

export const preFetchToken = async (accessToken: string) => {
    if (isSameToken(accessToken)) {
        try {
            await getFreshToken();
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
};
