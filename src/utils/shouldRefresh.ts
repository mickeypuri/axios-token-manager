import { AxiosError } from 'axios';
import { IConfig } from '../types';

export const shouldRefresh = (error: AxiosError, options: IConfig, refreshTries: number) => {
    const { response } = error;
    if (!response) {
        return false;
    }
    const { status } = response;
    const { refreshOnStatus, maxRefreshTries } = options;
    const authFailed = refreshOnStatus.includes(status as number);
    return authFailed && ( refreshTries < maxRefreshTries );
};
