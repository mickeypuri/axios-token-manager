# axios-token-manager

A library to manage caching of Axios Tokens with automatic refresh of Token on expiry or on error due to early revocation of the Token by the backend system.

<div style="margin: 1.5em">

[![npm version](https://img.shields.io/npm/v/axios-token-manager.svg)](https://www.npmjs.org/package/axios-token-manager)
[![Build Status](https://github.com/mickeypuri/axios-token-manager/actions/workflows/ci.yml/badge.svg?branch=main&label=CI)](https://github.com/mickeypuri/axios-token-manager/actions/workflows/ci.yml?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/mickeypuri/axios-token-manager/badge.svg?branch=main)](https://coveralls.io/github/mickeypuri/axios-token-manager?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/npm/axios-token-manager/badge.svg)](https://snyk.io/test/npm/axios-token-manager)

</div>

## Table of Contents

- [Purpose](#purpose)
- [Features](#features)
- [Installing](#installing)
- [Usage](#usage)
- [API](#api)

## Purpose

The purpose of Axios-Token-Manager is to cache an Authentication Token during its validity period. This reduces the number of calls that need to be made on the back end to fetch authentication tokens, and improves response speeds and reduces latency. 

The Axios-Token-Manager needs to be provided with a function which when invoked returns a new Authentication Token. Along with an `access_token` field, the token response should include an `expires_in` field giving the number of seconds till the token expires.

The Axios-Token-Manager is setup with an instance of Axios to which it applies request and response interceptors. All requests are intercepted and the Authentication Token is applied to the header of the outgoing request.

The Axios-Token-Manager will get a new Authentication Token a short time before the current token is due to expire, thereby ensuring that there is always a valid token available to be used. In the event that a request is being made and there is no valid token, then a fresh token will be requested and used in the Authentication header of the request, and then the fresh token will get cached.

Backend systems can sometimes revoke an Authentication Token before its expiry time. A request using such a token will fail with a 401 and possibly a 403 error. The Axios Token Manager intercepts all response and looks out for 401 errors. On receipt of a 401, it starts a recovery cycle in which it invalidates the cached token and fetches a new Token, which it caches. It then tries to recover the failed request by making a fresh request to the back end using the new Token. Only once this succeeds will the response be sent back to the caller. So the caller is unaware of what is happening and just gets a slightly delayed success response. 

In case callers want to be kept aware of what is happening under the hood there are a number of callbacks that can be hooked into.

## Features

- Fetch Authentication token using provided function
- Works out time till token expires
- Caches Authentication Token
- Applies Authentication Token to all outgoing requests on instance
- Fetches new Authentication Token a short time before current cached token expires
- Recovers from situation where the back end revokes a token before its expiry time is up
- Monitors response and in case of a 401, it fetches a new Authentication token and retries the request with fresh token
- After recovery from an early revokation of the Authentication token, it caches the fresh token
- Adds interceptors on the Request and Response of the provided Axios Instance
- Callbacks to notify calling application of token refresh, authentication fail, recovery try and recovery abort
- Format and configure authentication header
- Full Configuration of settings

## Installing

### Package manager

Using npm:

`$ npm install axios-token-manager`

Using yarn:

`$ yarn add axios-token-manager`

Once the package is installed, you can import the library using `import` or `require` approach:

`import tokenManager from 'axios-token-manager';`

If you use `require` for importing:

`const tokenManager = require('axios');`

## Usage

This defines a file which has a default export of an axios instance wired up with the axios-token-manager. 

The axios-oauth-client library has been used here as an example for the implementation of the function to get a new Token, it can of course be replaced by your preferred oauth or token library, or your own implementation to get a token.

**note**: `instance` and `getCredentials` are the two required configuration settings, the other settings are all optional.

```ts
import axios from 'axios';
import oauth from 'axios-oauth-client';
import tokenManager, { TokenProvider, Settings } from 'axios-token-manager';

// Define an Axios instance using a common baseURL, timeout and the common headers for all requests
 ...

const instance = axios.create({
    baseURL,
    timeout,
    headers
});

// define tokenURL to fetch the authorization token from, a clientId and a client secret
...

const getCredentials = oauth.clientCredentials(
    axios.create(),
    tokenURL,
    clientId,
    clientSecret
) as TokenProvider;

// define other optional settings for callbacks and other configurations (see API for config)
...

const settings: Settings = {
    instance,
    getCredentials,
    ...                     // define other optional configuration 
};

tokenManager(settings);

export default instance;
```

### Using all configurable options

The above example only used the two required settings. Below is an example using all the settings.

```ts
const settings: Settings = {
    instance,
    getCredentials,
    formatter,
    refreshOnStatus,
    addTokenToLogs,
    onTokenRefresh,
    onAuthFail,
    onTokenRequestFail,
    onRecoveryTry,
    onTokenTryThreshold,
    onRecoveryAbort,
};

tokenManager(settings);

export default instance;
```
## API

### refreshBuffer
The number of seconds at which the Token is refreshed before expiration of the currently cached token. Defaults to 10 seconds.

### header
The Header which is added to outgoing requests. Default is `Authorization`

### formatter
A function which takes in the `access_token` and returns the value to be assigned to the Header.

### addTokenToLogs
A boolean which controls whether the `access_token` value is returned in callbacks. When the `access_token` is returned it is part of a longer string giving the context. Default is `false`. 

### onTokenRefresh
Callback function when the Token is refreshed. If `addTokenToLogs` is true, a message containing the new Token's `access_token` is sent as an argument.

### onAuthFail
Callback function when the authentication fails and a status in the `refreshOnStatus` array is returned. If `addTokenToLogs` is true, a message containing the failed Token's `access_token` is sent as an argument.

### onTokenRequestFail
Callback function when a request for a new Token fails.

### refreshOnStatus
Array of Http Status codes on return of which the Token Manager will attempt to recover by fetching a new Token and retrying the request with the new Token. The default is `[401]`.

### tokenTryThreshold
If a request for a Token fails, then a new attempt is made to get a Token. Once the number of attempts reaches the `tokenTryThreshold` then a callback is invoked. The callback will be invoked again for every multiple of the `tokenTryThreshold`. The default is 10, therefore on every 10th failed attempt to get a fresh token the `onTokenTryThreshold` callback will be invoked.

### onTokenTryThreshold
Callback invoked when the number of failed attempts to get a new token reaches the `tokenTryThreshold` or any of its multiples. The callback is called with the number of failed tries an a parameter.

### onRecoveryTry
Callback invoked when an a attempt is made to resend the request using a fresh token after the earlier one failed with an authentication error defined in the `refreshOnStatus` setting. When `addTokenToLogs` is true, the callback will get invoked with a message giving the new `access_token` being used in the recovery attempt.

### maxRecoveryTries
The system counts the number of attempts to recover from a request which failed with an authentication error. At each failure, a new token will be requested and a fresh attempt to recover made. The `maxRecoveryTries` sets the limit after which the system will no longer try and recover and it will send an error response back to the original caller. The default value is 5.

### onRecoveryAbort
Callback invoked when the number of attempts to recover from authentication failures reaches the `maxRecoveryTries`.










