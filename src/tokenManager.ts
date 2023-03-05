import { ITokenManager, IToken, IDefaultConfig } from './types';
import { noop } from './utils/noop';

let token: IToken;

const defaultConfig: IDefaultConfig = {
    refreshBuffer: 10,
    header: 'Authorization',
    formatter: (access_token) => `Bearer ${access_token}`,
    onRefresh: noop,
    onAuthFail: noop
};

const tokenManager = (options: ITokenManager) => {
    const config = {...defaultConfig, ...options };


};

export default tokenManager;