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
    onTokenRefresh?: VoidFunction,
    onAuthFail?: VoidFunction,
    onTokenRequestFail?: VoidFunction,
    refreshOnStatus?: number [],
    retryThreshold?: number,
    onRetryThreshold?: (retries: number) => void,
    maxRecoveryTries?: number,
}

export interface IConfig {
    refreshBuffer: number,
    header: string,
    formatter: Formatter,
    onTokenRefresh: VoidFunction,
    onAuthFail: VoidFunction,
    onTokenRequestFail: VoidFunction,
    refreshOnStatus: number [],
    retryThreshold: number,
    onRetryThreshold: (retries: number) => void,
    maxRecoveryTries: number,
}

export interface IToken {
    access_token: string
    token_type: string,
    expires_in: number,
    scope: string
}

export interface IState {
    cache: ICache,
    options: IConfig,
    tokenTries: number,
    recoveryTries: number,
    inRecovery: boolean
}

export type TokenProvider = () => Promise<IToken>;

export type Formatter = (accessToken: string) => string;