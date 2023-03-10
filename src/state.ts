import { IState, IConfig, TokenProvider } from './types';
import { initCache } from './utils/initialValues';

let state: IState;

export const setInitialState = (options: IConfig, getCredentials: TokenProvider) => {
    state = {
        cache: initCache,
        options,
        tokenTries: 0,
        recoveryTries: 0,
        inRecovery: false,
        getCredentials
    };
};

export const updateState = (update: Partial<IState>) => {
    state = { ...state, ...update };
};

export const getState = () => state;
