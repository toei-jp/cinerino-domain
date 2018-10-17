/**
 * ムビチケ決済承認アクションサービス
 */
import * as mvtkapi from '@movieticket/reserve-api-nodejs-client';
import * as createDebug from 'debug';
import * as moment from 'moment-timezone';

import * as factory from '../../../../../../factory';
import { MongoRepository as ActionRepo } from '../../../../../../repo/action';
import { MongoRepository as EventRepo } from '../../../../../../repo/event';
import { MongoRepository as OrganizationRepo } from '../../../../../../repo/organization';
import { MongoRepository as TransactionRepo } from '../../../../../../repo/transaction';

const debug = createDebug('cinerino-domain:service');

export type ICreateOperation<T> = (repos: {
    action: ActionRepo;
    event: EventRepo;
    organization: OrganizationRepo;
    transaction: TransactionRepo;
    movieTicketAuthService: mvtkapi.service.Auth;
}) => Promise<T>;
/**
 * 承認アクション
 */
export function create(params: factory.action.authorize.paymentMethod.movieTicket.IObject & {
    agentId: string;
    transactionId: string;
}): ICreateOperation<factory.action.authorize.paymentMethod.movieTicket.IAction> {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        action: ActionRepo;
        event: EventRepo;
        organization: OrganizationRepo;
        transaction: TransactionRepo;
        movieTicketAuthService: mvtkapi.service.Auth;
    }) => {
        const transaction = await repos.transaction.findInProgressById({
            typeOf: factory.transactionType.PlaceOrder,
            id: params.transactionId
        });

        // 他者口座による決済も可能にするためにコメントアウト
        // 基本的に、自分の口座のオーソリを他者に与えても得しないので、
        // これが問題になるとすれば、本当にただサービスを荒らしたい悪質な攻撃のみ、ではある
        // if (transaction.agent.id !== agentId) {
        //     throw new factory.errors.Forbidden('A specified transaction is not yours.');
        // }

        const eventIds = Array.from(new Set(params.movieTickets.map((ticket) => ticket.serviceOutput.reservationFor.id)));
        if (eventIds.length !== 1) {
            throw new factory.errors.Argument('movieTickets', 'Number of events must be 1');
        }
        const eventId = eventIds[0];

        // イベント情報取得
        const screeningEvent = await repos.event.findById({ typeOf: factory.chevre.eventType.ScreeningEvent, id: eventId });

        // ショップ情報取得
        const movieTheater = await repos.organization.findById({
            typeOf: factory.organizationType.MovieTheater,
            id: transaction.seller.id
        });

        // 承認アクションを開始する
        const actionAttributes: factory.action.authorize.paymentMethod.movieTicket.IAttributes = {
            typeOf: factory.actionType.AuthorizeAction,
            object: {
                typeOf: factory.paymentMethodType.MovieTicket,
                movieTickets: params.movieTickets
            },
            agent: transaction.agent,
            recipient: transaction.seller,
            purpose: transaction // purposeは取引
        };
        const action = await repos.action.start(actionAttributes);

        let purchaseNumberAuthIn: factory.action.authorize.paymentMethod.movieTicket.IPurchaseNumberAuthIn;
        let purchaseNumberAuthResult: factory.action.authorize.paymentMethod.movieTicket.IPurchaseNumberAuthResult;
        try {
            if (movieTheater.paymentAccepted === undefined) {
                throw new factory.errors.Argument('transactionId', 'Movie Ticket payment not accepted');
            }
            const movieTicketPaymentAccepted = <factory.organization.IPaymentAccepted<factory.paymentMethodType.MovieTicket>>
                movieTheater.paymentAccepted.find((a) => a.paymentMethodType === factory.paymentMethodType.MovieTicket);
            if (movieTicketPaymentAccepted === undefined) {
                throw new factory.errors.Argument('transactionId', 'Movie Ticket payment not accepted');
            }

            const movieTicketIdentifiers: string[] = [];
            const knyknrNoInfoIn: mvtkapi.mvtk.services.auth.purchaseNumberAuth.IKnyknrNoInfoIn[] = [];
            params.movieTickets.forEach((movieTicket) => {
                if (movieTicketIdentifiers.indexOf(movieTicket.identifier) < 0) {
                    movieTicketIdentifiers.push(movieTicket.identifier);
                    knyknrNoInfoIn.push({
                        knyknrNo: movieTicket.identifier,
                        pinCd: movieTicket.accessCode
                    });
                }
            });
            purchaseNumberAuthIn = {
                kgygishCd: movieTicketPaymentAccepted.movieTicketInfo.kgygishCd,
                jhshbtsCd: mvtkapi.mvtk.services.auth.purchaseNumberAuth.InformationTypeCode.All,
                knyknrNoInfoIn: knyknrNoInfoIn,
                skhnCd: screeningEvent.superEvent.workPerformed.identifier,
                stCd: movieTicketPaymentAccepted.movieTicketInfo.stCd,
                jeiYmd: moment(screeningEvent.startDate).tz('Asia/Tokyo').format('YYYY/MM/DD')
            };
            purchaseNumberAuthResult = await repos.movieTicketAuthService.purchaseNumberAuth(purchaseNumberAuthIn);
            debug('purchaseNumberAuthResult:', purchaseNumberAuthResult);
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
        const result: factory.action.authorize.paymentMethod.movieTicket.IResult = {
            price: 0,
            purchaseNumberAuthIn: purchaseNumberAuthIn,
            purchaseNumberAuthResult: purchaseNumberAuthResult
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

        const action = await repos.action.cancel({ typeOf: factory.actionType.AuthorizeAction, id: params.actionId });
        const actionResult = <factory.action.authorize.paymentMethod.movieTicket.IResult>action.result;
        debug('actionResult:', actionResult);

        // 承認取消
        try {
            // some op
        } catch (error) {
            // no op
        }
    };
}
