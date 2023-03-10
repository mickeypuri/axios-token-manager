import { AxiosError } from 'axios';
import { getState, updateState } from '../state';

export const shouldRecover = (error: AxiosError) => {
    const { options, recoveryTries } = getState();
    const { response } = error;
    if (!response) {
        return false;
    }
    const { status } = response;
    const { refreshOnStatus, maxRecoveryTries, onAuthFail, onRecoveryAbort } = options;
    const authFailed = refreshOnStatus.includes(status as number);

    if (authFailed) {
        onAuthFail();

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
