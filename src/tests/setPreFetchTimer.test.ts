import { setPreFetchTimer } from '../utils/setPreFetchTimer';
import { preFetchToken } from '../utils/preFetchToken';
import { getState } from '../state';
import { Token } from '../types';
import { defaultSettings } from '../utils/initialValues';

jest.mock('../utils/preFetchToken', () => ({
    preFetchToken: jest.fn()
}));
jest.mock('../state');

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

afterAll(() => {
    jest.useRealTimers();
});

const EXPIRES_IN_SECS = 3600;
const ACCESS_TOKEN = 'Token One';

const token: Token = {
    access_token: ACCESS_TOKEN,
    token_type: 'Bearer',
    expires_in: EXPIRES_IN_SECS,
    scope: 'site wide'
};

describe('setPreFetchTimer', () => {
    it('will call setTimeout with the correct refresh time and access_token value', () => {
        (getState as jest.Mock).mockImplementationOnce(() => ({
            cache: { token, expiration: EXPIRES_IN_SECS },
            options: defaultSettings,
            tokenTries: 0,
            recoveryTries: 0,
            inRecovery: false,
            getCredentials: jest.fn()
        }));
        
        const { refreshBuffer } = defaultSettings;
        const refreshPeriod = (EXPIRES_IN_SECS - refreshBuffer) * 1000;

        setPreFetchTimer(token);

        expect(setTimeout).toBeCalled();
        expect(setTimeout).toHaveBeenLastCalledWith(preFetchToken, refreshPeriod, ACCESS_TOKEN);
    });
});
