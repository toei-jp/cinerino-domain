# Cinerino Domain Library for Node.js

[![npm (scoped)](https://img.shields.io/npm/v/@toei-jp/cinerino-domain.svg)](https://www.npmjs.com/package/@toei-jp/cinerino-domain)
[![CircleCI](https://circleci.com/gh/toei-jp/cinerino-domain.svg?style=svg)](https://circleci.com/gh/toei-jp/cinerino-domain)
[![Coverage Status](https://coveralls.io/repos/github/toei-jp/cinerino-domain/badge.svg?branch=master)](https://coveralls.io/github/toei-jp/cinerino-domain?branch=master)
[![Dependency Status](https://img.shields.io/david/toei-jp/cinerino-domain.svg)](https://david-dm.org/toei-jp/cinerino-domain)
[![Known Vulnerabilities](https://snyk.io/test/github/toei-jp/cinerino-domain/badge.svg)](https://snyk.io/test/github/toei-jp/cinerino-domain)
[![npm](https://img.shields.io/npm/dm/@toei-jp/cinerino-domain.svg)](https://nodei.co/npm/@toei-jp/cinerino-domain/)

CinerinoのバックエンドサービスをNode.jsで簡単に使用するためのパッケージを提供します。

## Table of contents

* [Usage](#usage)
* [Code Samples](#code-samples)
* [License](#license)

## Usage

```shell
npm install @toei-jp/cinerino-domain
```

### Environment variables

| Name                                 | Required | Value             | Purpose                |
|--------------------------------------|----------|-------------------|------------------------|
| `DEBUG`                              | false    | cinerino-domain:* | Debug                  |
| `NODE_ENV`                           | true     |                   | environment name       |
| `MONGOLAB_URI`                       | true     |                   | MongoDB connection URI |
| `SENDGRID_API_KEY`                   | true     |                   | SendGrid API Key       |
| `GMO_ENDPOINT`                       | true     |                   | GMO API endpoint       |
| `GMO_SITE_ID`                        | true     |                   | GMO SiteID             |
| `GMO_SITE_PASS`                      | true     |                   | GMO SitePass           |
| `DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN` | true     |                   | 開発者通知用LINEアクセストークン     |
| `WAITER_SECRET`                      | true     |                   | WAITER許可証トークン秘密鍵       |
| `WAITER_PASSPORT_ISSUER`             | true     |                   | WAITER許可証発行者           |
| `ORDER_INQUIRY_ENDPOINT`             | true     |                   | 注文照会エンドポイント            |

## Code Samples

Code sample are [here](https://github.com/toei-jp/cinerino-domain/tree/master/example).

## License

ISC
