import { Token } from '../types';
import { getState, updateState } from '../state';
import { setPreFetchTimer } from './setPreFetchTimer';

export const getFreshToken = async () : Promise<Token> => {
    const {options, getCredentials} = getState();

    try {
        const token = await getCredentials();
        const { access_token, expires_in } = token;
        const { onTokenRefresh, addTokenToLogs } = options;
        const expiration = Date.now() + expires_in * 1000;
        setPreFetchTimer(token);
        
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