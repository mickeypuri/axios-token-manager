import { IState, IConfig } from './types';
import { initCache } from './utils/initialValues';

let state: IState;


export const updateState = (update: Partial<IState>) => {
    state = { ...state, ...update };
};

export const getState = () => state;
