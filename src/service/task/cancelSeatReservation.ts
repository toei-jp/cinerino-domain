import { IConnectionSettings, IOperation } from '../task';

import * as chevre from '../../chevre';
import * as factory from '../../factory';
import { MongoRepository as ActionRepo } from '../../repo/action';

import * as StockService from '../stock';

/**
 * タスク実行関数
 */
export function call(data: factory.task.IData<factory.taskName.CancelSeatReservation>): IOperation<void> {
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
