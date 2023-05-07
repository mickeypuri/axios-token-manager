# axios-token-manager

A library to manage caching of Axios Tokens with automatic refresh of Token on expiry or on error

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

The purpose of Axios-Token-Manager is to cache an Authentication Token during its validity period. This reduces the number of calls that need to be made on the back end to fetch new authentication tokens, and improves response speeds and reduces latency. 

The Axios-Token-Manager needs to be provided with a function which when invoked returns a new Authentication Token. Along with an `access_token` field, the response should include an `expires_in` field giving the number of seconds till the token expires.



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
- Fully configurable




