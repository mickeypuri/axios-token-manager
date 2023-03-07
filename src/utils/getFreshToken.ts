import { IToken, IConfig, SetTries, SetCache, ITries } from '../types';

export const getFreshToken = async (options: IConfig, tries: ITries, setCache: SetCache) : Promise<IToken> => {
    const { getCredentials } = options;
    const { getTries, setTries } = tries;
    try {
        const credentialsPromise = getCredentials();
        if (!credentialsPromise.then) {
            throw new Error('axios-token-manager needs the function `getCredentials` to return a Promise');
        }
        const token = await credentialsPromise;
        const {expires_in} = token;
        const {refreshBuffer, onRefresh} = options;
        const timeSpan = (expires_in - refreshBuffer) * 1000;
        const expiration = Date.now() + timeSpan;
        setCache({ token, expiration });
        setTries(0);
        onRefresh();
        return Promise.resolve(token);
    } 
    catch (error) {
        const retries = getTries();
        setTries(retries + 1);
        const { onTokenRequestFail, retryThreshold, onRetryThreshold } = options;
        onTokenRequestFail();
        if (retries % retryThreshold === 0) {
            onRetryThreshold(retries);
        }
        return Promise.reject(error);
    }
};