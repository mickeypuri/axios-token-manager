import { AxiosInstance } from 'axios';

export interface ITokenManager extends IDefaultConfig {
    instance: AxiosInstance,
    getToken: TokenProvider,
}

export interface IDefaultConfig {
    refreshBuffer?: number,
    header?: string,
    formatter?: Formatter,
    onRefresh?: VoidFunction,
    onAuthFail?: VoidFunction,
}

export interface IToken {
    access_token: string
    token_type: string,
    expires_in: number,
    scope: string
}

export type TokenProvider = () => Promise<IToken>;

export type Formatter = (accessToken: string) => string;