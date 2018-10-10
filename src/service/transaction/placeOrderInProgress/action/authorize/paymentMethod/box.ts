/**
 * クレジットカード決済承認アクションサービス
 */
import * as createDebug from 'debug';

import * as factory from '../../../../../../factory';
import { MongoRepository as ActionRepo } from '../../../../../../repo/action';
import { MongoRepository as OrganizationRepo } from '../../../../../../repo/organization';
import { MongoRepository as TransactionRepo } from '../../../../../../repo/transaction';

const debug = createDebug('cinerino-domain:service');

export type ICreateOperation<T> = (repos: {
    action: ActionRepo;
    organization: OrganizationRepo;
    transaction: TransactionRepo;
}) => Promise<T>;

/**
 * クレジットカードオーソリ取得
 */
export function create(params: {
    agentId: string;
    transactionId: string;
    amount: number;
    paymentMethod: factory.boxPaymentMethodType;
    cash?: { received: number; returned: number };
}): ICreateOperation<factory.action.authorize.paymentMethod.box.IAction> {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        action: ActionRepo;
        organization: OrganizationRepo;
        transaction: TransactionRepo;
    }) => {
        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transactionId
        });

        const movieTheater = await repos.organization.findById({
            typeOf: factory.organizationType.MovieTheater,
            id: transaction.seller.id
        });

        // 承認アクションを開始する
        const actionAttributes: factory.action.authorize.paymentMethod.box.IAttributes = {
            typeOf: factory.actionType.AuthorizeAction,
            object: {
                typeOf: params.paymentMethod,
                transactionId: params.transactionId,
                amount: params.amount
            },
            agent: transaction.agent,
            recipient: transaction.seller,
            purpose: transaction // purposeは取引
        };
        if (params.paymentMethod === factory.boxPaymentMethodType.Cash) {
            actionAttributes.object.cash = params.cash;
        }
        const action = await repos.action.start(actionAttributes);
        try {
            if (movieTheater.paymentAccepted === undefined) {
                throw new factory.errors.Argument('transactionId', `${params.paymentMethod} payment not accepted.`);
            }
            const paymentAccepted =
                movieTheater.paymentAccepted.find(
                    (a) => a.paymentMethodType === params.paymentMethod
                );
            if (paymentAccepted === undefined) {
                throw new factory.errors.Argument('transactionId', `${params.paymentMethod} payment not accepted.`);
            }
        } catch (error) {
            debug(error);
            // actionにエラー結果を追加
            try {
                const actionError = { ...error, message: error.message, name: error.name };
                await repos.action.giveUp({ typeOf: action.typeOf, id: action.id, error: actionError });
            } catch (__) {
                // 失敗したら仕方ない
            }

            throw error;
        }

        // アクションを完了
        debug('ending authorize action...');

        const result: factory.action.authorize.paymentMethod.box.IResult = {
            price: params.amount,
            amount: 0
        };

        return repos.action.complete({ typeOf: action.typeOf, id: action.id, result: result });
    };
}

export function cancel(params: {
    agentId: string;
    transactionId: string;
    actionId: string;
}) {
    return async (repos: {
        action: ActionRepo;
        transaction: TransactionRepo;
    }) => {
        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transactionId
        });

        if (transaction.agent.id !== params.agentId) {
            throw new factory.errors.Forbidden('A specified transaction is not yours.');
        }

        await repos.action.cancel({ typeOf: factory.actionType.AuthorizeAction, id: params.actionId });
    };
}
