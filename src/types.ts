import { AxiosInstance } from 'axios';

export interface Cache {
    token: Token | null;
    expiration: number;
}

export interface Settings extends DefaultSettings {
    instance: AxiosInstance;
    getCredentials: TokenProvider;
}

export type LogFunction = (message?: string) => void;

type DefaultSettings = Partial<Config>;

export interface Config {
    refreshBuffer: number;
    header: string;
    formatter: Formatter;
    onTokenRefresh: LogFunction;
    onAuthFail: LogFunction;
    onTokenRequestFail: VoidFunction;
    refreshOnStatus: number [];
    tokenTryThreshold: number;
    onTokenTryThreshold: (retries: number) => void;
    onRecoveryTry: LogFunction;
    maxRecoveryTries: number;
    onRecoveryAbort: VoidFunction;
    addTokenToLogs: boolean;
}

export interface Token {
    access_token: string;
    token_type?: string;
    expires_in: number;
    scope?: string;
}

export interface State {
    cache: Cache;
    options: Config;
    tokenTries: number;
    recoveryTries: number;
    inRecovery: boolean;
    getCredentials: TokenProvider;
}

export type TokenProvider = () => Promise<Token>;

export type Formatter = (accessToken: string) => string;