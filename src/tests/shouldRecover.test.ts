import { AxiosError } from 'axios';
import { shouldRecover } from '../utils/shouldRecover';
import { defaultSettings } from '../utils/initialValues';
import { IToken, LogFunction } from '../types';

import { getState, updateState } from '../state';
import { initCache } from '../utils/initialValues';

jest.mock('../state');

const token: IToken = {
    access_token: 'Token One',
    token_type: 'Bearer',
    expires_in: 0,
    scope: 'site wide'
};

describe.only('shouldRecover from error', () => {
    it('will return false if there is no response in the error', () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: 0 },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));
        
        const error = {} as unknown as AxiosError;
        const returnValue = shouldRecover(error);
        
        expect(returnValue).toBe(false);
    });

    it('will abort recovery and reset state if recovery tries is equal to max tries', () => {
        const onRecoveryAbort: LogFunction = jest.fn();
        const { maxRecoveryTries } = defaultSettings;

        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: 0 },
            options: { ...defaultSettings, onRecoveryAbort },
            tokenTries: 0,
            recoveryTries: maxRecoveryTries,
            inRecovery: true,
            getCredentials: jest.fn()
        }));

        const error = {
            response: {
                status: 401
            }
        } as unknown as AxiosError;

        const returnValue = shouldRecover(error);

        expect((updateState as jest.Mock)).toBeCalledWith({
            inRecovery: false,
            recoveryTries: 0,
            cache: initCache
        });
        expect((onRecoveryAbort as jest.Mock)).toBeCalledTimes(1);
        expect(returnValue).toBe(false);
    });
});
