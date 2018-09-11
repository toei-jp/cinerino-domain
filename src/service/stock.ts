/**
 * 在庫管理サービス
 * 在庫仕入れ、在庫調整等
 */
import * as createDebug from 'debug';
import { google } from 'googleapis';

import * as chevre from '../chevre';
import * as factory from '../factory';
import { MongoRepository as ActionRepo } from '../repo/action';
import { MongoRepository as EventRepo } from '../repo/event';

const debug = createDebug('cinerino-domain:service');

export type IPlaceOrderTransaction = factory.transaction.placeOrder.ITransaction;

const customsearch = google.customsearch('v1');
/**
 * 上映イベントをインポートする
 */
export function importScreeningEvents(params: {
    locationBranchCode: string;
    importFrom: Date;
    importThrough: Date;
}) {
    // tslint:disable-next-line:max-func-body-length
    return async (repos: {
        event: EventRepo;
        eventService: chevre.service.Event;
    }) => {
        // 上映スケジュール取得
        const searchScreeningEventsResult = await repos.eventService.searchScreeningEvents({
            inSessionFrom: params.importFrom,
            inSessionThrough: params.importThrough,
            superEvent: {
                locationBranchCodes: [params.locationBranchCode]
            }
        });
        const screeningEvents = searchScreeningEventsResult.data;
        // 各作品画像を検索
        const movies = screeningEvents
            .map((e) => e.superEvent.workPerformed)
            .filter((movie, pos, arr) => arr.map((mapObj) => mapObj.identifier).indexOf(movie.identifier) === pos);
        const thumbnailsByMovie = await Promise.all(movies.map(async (movie) => {
            return {
                identifier: movie.identifier,
                thumbnail: await findMovieImage({ query: movie.name })
            };
        }));
        // 上映イベントごとに永続化トライ
        await Promise.all(screeningEvents.map(async (e) => {
            try {
                // サムネイル画像があれば情報追加
                const thumbnailOfMovie = thumbnailsByMovie.find(
                    (t) => t.identifier === e.superEvent.workPerformed.identifier
                );
                if (thumbnailOfMovie !== undefined && thumbnailOfMovie.thumbnail !== undefined) {
                    e.workPerformed.thumbnailUrl = thumbnailOfMovie.thumbnail;
                    e.superEvent.workPerformed.thumbnailUrl = thumbnailOfMovie.thumbnail;
                }
                await repos.event.save<factory.chevre.eventType.ScreeningEvent>(e);
            } catch (error) {
                // tslint:disable-next-line:no-single-line-block-comment
                /* istanbul ignore next */
                console.error(error);
            }
        }));
        debug(`${screeningEvents.length} screeningEvents stored.`);
    };
}
export async function findMovieImage(params: {
    query: string;
}) {
    return new Promise<string | undefined>((resolve) => {
        customsearch.cse.list(
            {
                cx: <string>process.env.CUSTOM_SEARCH_ENGINE_ID,
                q: params.query,
                auth: <string>process.env.GOOGLE_API_KEY,
                num: 1,
                rights: 'cc_publicdomain cc_sharealike',
                // start: 0,
                // imgSize: 'medium',
                searchType: 'image'
            },
            (err: any, res: any) => {
                if (!(err instanceof Error)) {
                    if (typeof res.data === 'object' && Array.isArray(res.data.items) && res.data.items.length > 0) {
                        debug('custome search result:', res.data);
                        resolve(<string>res.data.items[0].image.thumbnailLink);
                        // resolve(<string>res.data.items[0].link);

                        return;
                        // thumbnails.push({
                        //     eventId: event.id,
                        //     link: res.data.items[0].link,
                        //     thumbnailLink: res.data.items[0].image.thumbnailLink
                        // });
                    }
                }

                resolve(undefined);
            }
        );
    });
}
/**
 * 座席仮予約キャンセル
 */
export function cancelSeatReservationAuth(params: { transactionId: string }) {
    return async (repos: {
        action: ActionRepo;
        reserveService: chevre.service.transaction.Reserve;
    }) => {
        // 座席仮予約アクションを取得
        const authorizeActions = <factory.action.authorize.offer.seatReservation.IAction[]>
            await repos.action.findAuthorizeByTransactionId(params).then((actions) => actions
                .filter((a) => a.object.typeOf === factory.action.authorize.offer.seatReservation.ObjectType.SeatReservation)
                .filter((a) => a.actionStatus === factory.actionStatusType.CompletedActionStatus)
            );

        await Promise.all(authorizeActions.map(async (action) => {
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (action.result !== undefined) {
                debug('calling reserve transaction...');
                await repos.reserveService.cancel({ transactionId: action.result.responseBody.id });
            }
        }));
    };
}
