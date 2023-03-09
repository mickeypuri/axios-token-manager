import { AxiosInstance } from 'axios';

export interface ICache {
    token: IToken | null,
    expiration: number
}

export interface ITokenManager extends IDefaultSettings {
    instance: AxiosInstance,
    getCredentials: TokenProvider,
}

export interface IDefaultSettings {
    refreshBuffer?: number,
    header?: string,
    formatter?: Formatter,
    onRefresh?: VoidFunction,
    onAuthFail?: VoidFunction,
    onTokenRequestFail?: VoidFunction,
    refreshOnStatus?: number [],
    retryThreshold?: number,
    onRetryThreshold?: (retries: number) => void,
    maxRefreshTries?: number,
}

export interface IConfig {
    refreshBuffer: number,
    header: string,
    formatter: Formatter,
    onRefresh: VoidFunction,
    onAuthFail: VoidFunction,
    onTokenRequestFail: VoidFunction,
    refreshOnStatus: number [],
    retryThreshold: number,
    onRetryThreshold: (retries: number) => void,
    maxRefreshTries: number,
}

export interface IToken {
    access_token: string
    token_type: string,
    expires_in: number,
    scope: string
}

export interface ITriesAccess {
    setTries: SetTries,
    getTries: GetTries
}

export interface IState {
    cache: ICache,
    options: IConfig,
    retries: number,
    refreshTries: number,
    inRefresh: boolean
}

export type SetTries = (tries: number) => void;
export type GetTries = () => number;

export type SetCache = (cache: ICache) => void;

export type TokenProvider = () => Promise<IToken>;

export type Formatter = (accessToken: string) => string;