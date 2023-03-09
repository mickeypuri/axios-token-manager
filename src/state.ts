import { IState, IConfig } from './types';
import { initCache } from './utils/initialValues';

let state: IState;

export const setInitialState = (options: IConfig) => {
    state = {
        cache: initCache,
        options,
        tokenTries: 0,
        recoveryTries: 0,
        inRecovery: false
    }
};


export const updateState = (update: Partial<IState>) => {
    state = { ...state, ...update };
};

export const getState = () => state;
