import { IState } from './types';
import { defaultSettings, initCache } from './utils/initialValues';

let state: IState = {
    cache: initCache,
    options: defaultSettings,
    retries: 0,
    refreshTries: 0,
    inRefresh: false
};

export const updateState = (update: Partial<IState>) => {
    state = { ...state, ...update };
};

export const getState = () => state;
