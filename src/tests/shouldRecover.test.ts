import { AxiosError } from 'axios';
import { shouldRecover } from '../utils/shouldRecover';
import { defaultSettings } from '../utils/initialValues';
import { IToken } from '../types';

import { getState } from '../state';

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

});
