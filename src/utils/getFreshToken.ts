import { IToken, TokenProvider } from '../types';
import { getState, updateState } from '../state';

export const getFreshToken = async (getCredentials :TokenProvider) : Promise<IToken> => {
    const {options} = getState();

    try {
        const token = await getCredentials();
        const { access_token, expires_in } = token;
        const { refreshBuffer, onTokenRefresh, addTokenToLogs } = options;
        const timeSpan = (expires_in - refreshBuffer) * 1000;
        const expiration = Date.now() + timeSpan;

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