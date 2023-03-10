import { IToken, TokenProvider } from '../types';
import { getState, updateState } from '../state';

export const getFreshToken = async (getCredentials :TokenProvider) : Promise<IToken> => {
    const {options} = getState();

    try {
        const token = await getCredentials();
        const {expires_in} = token;
        const {refreshBuffer, onTokenRefresh} = options;
        const timeSpan = (expires_in - refreshBuffer) * 1000;
        const expiration = Date.now() + timeSpan;

        updateState({ 
            cache: { token, expiration },
            tokenTries: 0
        });

        onTokenRefresh();
        return Promise.resolve(token);
    } 
    catch (error) {
        const { tokenTries } = getState();
        updateState({ tokenTries: tokenTries + 1 });
        const { onTokenRequestFail, retryThreshold, onRetryThreshold } = options;
        onTokenRequestFail();
        if (tokenTries % retryThreshold === 0) {
            onRetryThreshold(tokenTries);
        }
        return Promise.reject(error);
    }
};