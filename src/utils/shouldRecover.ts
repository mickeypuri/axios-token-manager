import { AxiosError } from 'axios';
import { getState, updateState } from '../state';
import { IToken } from '../types';

export const shouldRecover = (error: AxiosError) => {
    const { options, cache : { token }, recoveryTries } = getState();
    const { response } = error;
    if (!response) {
        return false;
    }
    const { status } = response;
    const { refreshOnStatus, maxRecoveryTries, onAuthFail, onRecoveryAbort, addTokenToLogs } = options;
    const authFailed = refreshOnStatus.includes(status as number);

    if (authFailed) {
        const { access_token } = token as IToken;
        const message = addTokenToLogs ? `Used token: ${access_token}` : '';
        onAuthFail(message);

        if (recoveryTries < maxRecoveryTries) {
            updateState({
                inRecovery: true,
                recoveryTries: recoveryTries + 1
            });
            return true;
        } 
        else {
            onRecoveryAbort();
            updateState({
                inRecovery: false,
                recoveryTries: 0
            });
        }
    }

    return false;
};
