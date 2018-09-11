/**
 * 口座サービス
 * 口座の保管先はPecorinoサービスです。
 */
import * as pecorinoapi from '@pecorino/api-nodejs-client';
import * as moment from 'moment';
import * as uuid from 'uuid';

import * as factory from '../factory';

import { handlePecorinoError } from '../errorHandler';
import { RedisRepository as AccountNumberRepo } from '../repo/accountNumber';
import { MongoRepository as OwnershipInfoRepo } from '../repo/ownershipInfo';

type IOwnershipInfo = factory.ownershipInfo.IOwnershipInfo<factory.ownershipInfo.IGood<factory.ownershipInfo.AccountGoodType.Account>>;
type IOwnershipInfoWithDetail =
    factory.ownershipInfo.IOwnershipInfo<factory.ownershipInfo.IGoodWithDetail<factory.ownershipInfo.AccountGoodType.Account>>;
type IAccountsOperation<T> = (repos: {
    ownershipInfo: OwnershipInfoRepo;
    accountService: pecorinoapi.service.Account;
}) => Promise<T>;
/**
 * 口座開設
 */
export function open<T extends factory.accountType>(params: {
    agent: factory.ownershipInfo.IOwner;
    name: string;
    accountType: T;
}) {
    return async (repos: {
        ownershipInfo: OwnershipInfoRepo;
        /**
         * 口座番号リポジトリー
         */
        accountNumber: AccountNumberRepo;
        /**
         * Pecorino口座サービス
         */
        accountService: pecorinoapi.service.Account;
    }) => {
        const now = new Date();
        let ownershipInfoWithDetail: IOwnershipInfoWithDetail;
        try {
            // 口座番号を発行
            const accountNumber = await repos.accountNumber.publish(new Date());
            const account = await repos.accountService.open({
                accountType: params.accountType,
                accountNumber: accountNumber,
                name: params.name
            });
            const ownershipInfo: IOwnershipInfo = {
                typeOf: 'OwnershipInfo',
                id: uuid.v4(),
                typeOfGood: {
                    typeOf: factory.ownershipInfo.AccountGoodType.Account,
                    accountType: account.accountType,
                    accountNumber: account.accountNumber
                },
                ownedBy: params.agent,
                ownedFrom: now,
                // tslint:disable-next-line:no-magic-numbers
                ownedThrough: moment(now).add(100, 'years').toDate() // 十分に無期限
            };
            await repos.ownershipInfo.save(ownershipInfo);
            ownershipInfoWithDetail = { ...ownershipInfo, typeOfGood: account };
        } catch (error) {
            error = handlePecorinoError(error);
            throw error;
        }

        return ownershipInfoWithDetail;
    };
}
/**
 * 口座解約
 */
export function close<T extends factory.accountType>(params: {
    ownedBy: {
        id: string;
    };
    accountType: T;
    accountNumber: string;
}): IAccountsOperation<void> {
    return async (repos: {
        ownershipInfo: OwnershipInfoRepo;
        accountService: pecorinoapi.service.Account;
    }) => {
        try {
            const accountOwnershipInfos = await repos.ownershipInfo.search<factory.ownershipInfo.AccountGoodType.Account>({
                typeOfGood: {
                    typeOf: factory.ownershipInfo.AccountGoodType.Account,
                    accountType: params.accountType,
                    accountNumbers: [params.accountNumber]
                },
                ownedBy: params.ownedBy
            });
            const ownershipInfo = accountOwnershipInfos[0];
            if (ownershipInfo === undefined) {
                throw new factory.errors.NotFound('Account');
            }
            await repos.accountService.close({
                accountType: ownershipInfo.typeOfGood.accountType,
                accountNumber: ownershipInfo.typeOfGood.accountNumber
            });
        } catch (error) {
            error = handlePecorinoError(error);
            throw error;
        }
    };
}
/**
 * 口座検索
 */
export function search(
    params: factory.ownershipInfo.ISearchConditions<factory.ownershipInfo.AccountGoodType.Account>
): IAccountsOperation<IOwnershipInfoWithDetail[]> {
    return async (repos: {
        ownershipInfo: OwnershipInfoRepo;
        accountService: pecorinoapi.service.Account;
    }) => {
        let ownershipInfosWithDetail: IOwnershipInfoWithDetail[] = [];
        try {
            // 口座所有権を検索
            const ownershipInfos = await repos.ownershipInfo.search<factory.ownershipInfo.AccountGoodType.Account>(params);
            const accountNumbers = ownershipInfos.map((o) => o.typeOfGood.accountNumber);
            if (accountNumbers.length > 0) {
                const accounts = await repos.accountService.search({
                    accountType: params.typeOfGood.accountType,
                    accountNumbers: accountNumbers,
                    statuses: [],
                    limit: 100
                });
                ownershipInfosWithDetail = ownershipInfos.map((o) => {
                    const account = accounts.find((a) => a.accountNumber === o.typeOfGood.accountNumber);
                    if (account === undefined) {
                        throw new factory.errors.NotFound('Account');
                    }

                    return { ...o, typeOfGood: account };
                });
            }
        } catch (error) {
            error = handlePecorinoError(error);
            throw error;
        }

        return ownershipInfosWithDetail;
    };
}
/**
 * 口座取引履歴検索
 */
export function searchMoneyTransferActions<T extends factory.accountType>(
    params: {
        ownedBy: {
            id: string;
        };
        ownedFrom?: Date;
        ownedThrough?: Date;
        conditions: pecorinoapi.factory.action.transfer.moneyTransfer.ISearchConditions<T>;
    }
): IAccountsOperation<factory.pecorino.action.transfer.moneyTransfer.IAction<T>[]> {
    return async (repos: {
        ownershipInfo: OwnershipInfoRepo;
        accountService: pecorinoapi.service.Account;
    }) => {
        let actions: factory.pecorino.action.transfer.moneyTransfer.IAction<T>[] = [];
        try {
            const ownershipInfos = await repos.ownershipInfo.search<factory.ownershipInfo.AccountGoodType.Account>({
                typeOfGood: {
                    typeOf: factory.ownershipInfo.AccountGoodType.Account,
                    accountType: params.conditions.accountType,
                    accountNumbers: [params.conditions.accountNumber]
                },
                ownedBy: params.ownedBy,
                ownedFrom: params.ownedFrom,
                ownedThrough: params.ownedThrough
            });
            const ownershipInfo = ownershipInfos[0];
            if (ownershipInfo === undefined) {
                throw new factory.errors.NotFound('Account');
            }
            actions = await repos.accountService.searchMoneyTransferActions(params.conditions);
        } catch (error) {
            error = handlePecorinoError(error);
            throw error;
        }

        return actions;
    };
}
