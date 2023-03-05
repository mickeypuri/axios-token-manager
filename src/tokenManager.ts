import { ITokenManager, IToken, IDefaultSettings } from './types';
import { noop } from './utils/noop';

let token: IToken;

const defaultSettings: IDefaultSettings = {
    refreshBuffer: 10,
    header: 'Authorization',
    formatter: (access_token) => `Bearer ${access_token}`,
    onRefresh: noop,
    onAuthFail: noop
};

const tokenManager = (settings: ITokenManager) => {
    const options = {...defaultSettings, ...settings };




};

export default tokenManager;