# Changelog

# [v 1.0.0](https://github.com/mickeypuri/axios-token-manager/compare/v0.2.8...v1.0.0) (2023-05-16)

## Changes from pre-release v 0.2.8

* **documentation:** added full documentation including description, installation, usage examples and api.
* **naming of interfaces:** removed prefix I from interfaces to bring in line with the more common approach of interface naming.
* **renamed ITokenManager:** the `ITokenManager` interface was renamed to `Settings`
* **pre fetch of token:** added feature of pre fetch of token, to replace a token a short time before it is due to expire so we never have any delay
