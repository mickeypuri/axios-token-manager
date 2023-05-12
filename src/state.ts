import { State, Config, TokenProvider } from './types';
import { initCache } from './utils/initialValues';

let state: State;

export const setInitialState = (options: Config, getCredentials: TokenProvider) => {
    state = {
        cache: initCache,
        options,
        tokenTries: 0,
        recoveryTries: 0,
        inRecovery: false,
        getCredentials
    };
};

export const updateState = (update: Partial<State>) => {
    state = { ...state, ...update };
};

export const getState = () => state;
