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
- [Axios Token Manager API](#axios-token-manager-api)

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
- Callbacks to notify calling applicatin of token refresh, authentication fail, recovery try and recovery abort
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







