/**
 * タスクファンクションサービス
 * タスク名ごとに、実行するファンクションをひとつずつ定義しています
 */
import * as pecorino from '@pecorino/api-nodejs-client';
import * as chevre from '@toei-jp/chevre-api-nodejs-client';
import * as factory from '@toei-jp/cinerino-factory';

import { MongoRepository as ActionRepo } from '../repo/action';
import { MongoRepository as OrderRepo } from '../repo/order';
import { MongoRepository as OwnershipInfoRepo } from '../repo/ownershipInfo';
import { MongoRepository as TaskRepo } from '../repo/task';
import { MongoRepository as TransactionRepo } from '../repo/transaction';

import * as DeliveryService from '../service/delivery';
import * as NotificationService from '../service/notification';
import * as OrderService from '../service/order';
import * as PaymentService from '../service/payment';
import * as StockService from '../service/stock';
import { IConnectionSettings } from './task';

export type IOperation<T> = (settings: IConnectionSettings) => Promise<T>;

export function sendEmailMessage(data: factory.task.sendEmailMessage.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        await NotificationService.sendEmailMessage(data.actionAttributes)({ action: actionRepo });
    };
}
export function cancelSeatReservation(data: factory.task.cancelSeatReservation.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        if (settings.chevreEndpoint === undefined) {
            throw new Error('settings.chevreEndpoint undefined.');
        }
        if (settings.chevreAuthClient === undefined) {
            throw new Error('settings.chevreAuthClient undefined.');
        }
        const actionRepo = new ActionRepo(settings.connection);
        const reserveService = new chevre.service.transaction.Reserve({
            endpoint: settings.chevreEndpoint,
            auth: settings.chevreAuthClient
        });
        await StockService.cancelSeatReservationAuth(data)({
            action: actionRepo,
            reserveService: reserveService
        });
    };
}
export function cancelCreditCard(data: factory.task.cancelCreditCard.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        await PaymentService.creditCard.cancelCreditCardAuth(data)({ action: actionRepo });
    };
}
export function cancelAccount(data: factory.task.cancelAccount.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoEndpoint === undefined) {
            throw new Error('settings.pecorinoEndpoint undefined.');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        const withdrawService = new pecorino.service.transaction.Withdraw({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        const transferService = new pecorino.service.transaction.Transfer({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        await PaymentService.account.cancelAccountAuth(data)({
            action: actionRepo,
            withdrawService: withdrawService,
            transferService: transferService
        });
    };
}
export function cancelPointAward(data: factory.task.cancelPointAward.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        await DeliveryService.cancelPointAward(data)({
            action: new ActionRepo(settings.connection),
            pecorinoAuthClient: settings.pecorinoAuthClient
        });
    };
}
export function payCreditCard(data: factory.task.payCreditCard.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        const transactionRepo = new TransactionRepo(settings.connection);
        await PaymentService.creditCard.payCreditCard(data)({
            action: actionRepo,
            transaction: transactionRepo
        });
    };
}
export function payAccount(data: factory.task.payAccount.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoEndpoint === undefined) {
            throw new Error('settings.pecorinoEndpoint undefined.');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        const withdrawService = new pecorino.service.transaction.Withdraw({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        const transferService = new pecorino.service.transaction.Transfer({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        await PaymentService.account.payAccount(data)({
            action: actionRepo,
            withdrawService: withdrawService,
            transferService: transferService
        });
    };
}
export function payMocoin(data: factory.task.payMocoin.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.mocoinAuthClient === undefined) {
            throw new Error('settings.mocoinAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        await PaymentService.mocoin.payMocoin(data)({
            action: actionRepo,
            mocoinAuthClient: settings.mocoinAuthClient
        });
    };
}
export function placeOrder(data: factory.task.placeOrder.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        const orderRepo = new OrderRepo(settings.connection);
        const transactionRepo = new TransactionRepo(settings.connection);
        const taskRepo = new TaskRepo(settings.connection);
        await OrderService.createFromTransaction(data)({
            action: actionRepo,
            order: orderRepo,
            transaction: transactionRepo,
            task: taskRepo
        });
    };
}
export function refundCreditCard(data: factory.task.refundCreditCard.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        const actionRepo = new ActionRepo(settings.connection);
        const transactionRepo = new TransactionRepo(settings.connection);
        const taskRepo = new TaskRepo(settings.connection);
        await PaymentService.creditCard.refundCreditCard(data)({
            action: actionRepo,
            transaction: transactionRepo,
            task: taskRepo
        });
    };
}
export function refundAccount(data: factory.task.refundAccount.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoEndpoint === undefined) {
            throw new Error('settings.pecorinoEndpoint undefined.');
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        const taskRepo = new TaskRepo(settings.connection);
        const depositService = new pecorino.service.transaction.Deposit({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        const transferService = new pecorino.service.transaction.Transfer({
            endpoint: settings.pecorinoEndpoint,
            auth: settings.pecorinoAuthClient
        });
        await PaymentService.account.refundAccount(data)({
            action: actionRepo,
            task: taskRepo,
            depositService: depositService,
            transferService: transferService
        });
    };
}
export function returnOrder(data: factory.task.returnOrder.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        if (settings.chevreEndpoint === undefined) {
            throw new Error('settings.chevreEndpoint undefined.');
        }
        if (settings.chevreAuthClient === undefined) {
            throw new Error('settings.chevreAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        const orderRepo = new OrderRepo(settings.connection);
        const transactionRepo = new TransactionRepo(settings.connection);
        const taskRepo = new TaskRepo(settings.connection);
        const cancelReservationService = new chevre.service.transaction.CancelReservation({
            endpoint: settings.chevreEndpoint,
            auth: settings.chevreAuthClient
        });
        await OrderService.cancelReservations(data.transactionId)({
            action: actionRepo,
            order: orderRepo,
            transaction: transactionRepo,
            task: taskRepo,
            cancelReservationService: cancelReservationService
        });
    };
}
export function sendOrder(data: factory.task.returnOrder.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.redisClient === undefined) {
            throw new Error('settings.redisClient undefined.');
        }
        if (settings.chevreEndpoint === undefined) {
            throw new Error('settings.chevreEndpoint undefined.');
        }
        if (settings.chevreAuthClient === undefined) {
            throw new Error('settings.chevreAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        const orderRepo = new OrderRepo(settings.connection);
        const ownershipInfoRepo = new OwnershipInfoRepo(settings.connection);
        const transactionRepo = new TransactionRepo(settings.connection);
        const taskRepo = new TaskRepo(settings.connection);
        const reserveService = new chevre.service.transaction.Reserve({
            endpoint: settings.chevreEndpoint,
            auth: settings.chevreAuthClient
        });
        await DeliveryService.sendOrder(data)({
            action: actionRepo,
            order: orderRepo,
            ownershipInfo: ownershipInfoRepo,
            transaction: transactionRepo,
            task: taskRepo,
            reserveService: reserveService
        });
    };
}
export function givePointAward(data: factory.task.givePointAward.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        await DeliveryService.givePointAward(data)({
            action: actionRepo,
            pecorinoAuthClient: settings.pecorinoAuthClient
        });
    };
}
export function returnPointAward(data: factory.task.returnPointAward.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore if */
        if (settings.pecorinoAuthClient === undefined) {
            throw new Error('settings.pecorinoAuthClient undefined.');
        }

        const actionRepo = new ActionRepo(settings.connection);
        await DeliveryService.returnPointAward(data)({
            action: actionRepo,
            pecorinoAuthClient: settings.pecorinoAuthClient
        });
    };
}
