import { Token, TokenProvider } from '../types';
import { getState, updateState } from '../state';
import { preFetchToken } from './preFetchToken';

export const getFreshToken = async (getCredentials :TokenProvider) : Promise<Token> => {
    const {options} = getState();

    try {
        const token = await getCredentials();
        const { access_token, expires_in } = token;
        const { refreshBuffer, onTokenRefresh, addTokenToLogs } = options;
        const expiration = Date.now() + expires_in * 1000;
        const refreshTime = expiration - refreshBuffer * 1000;
        setTimeout(preFetchToken, refreshTime, access_token);

        updateState({ 
            cache: { token, expiration },
            tokenTries: 0
        });

        const message = addTokenToLogs ? ` New token: ${access_token}.` : '';
        onTokenRefresh(message);
        return Promise.resolve(token);
    } 
    catch (error) {
        const { tokenTries } = getState();
        updateState({ tokenTries: tokenTries + 1 });
        const { onTokenRequestFail, tokenTryThreshold, onTokenTryThreshold } = options;
        onTokenRequestFail();
        if (tokenTries % tokenTryThreshold === 0) {
            onTokenTryThreshold(tokenTries);
        }
        return Promise.reject(error);
    }
};