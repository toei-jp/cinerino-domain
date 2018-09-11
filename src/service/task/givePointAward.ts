import { IConnectionSettings, IOperation } from '../task';

import * as factory from '../../factory';
import { MongoRepository as ActionRepo } from '../../repo/action';

import * as DeliveryService from '../delivery';

/**
 * タスク実行関数
 */
export function call(data: factory.task.IData<factory.taskName.GivePointAward>): IOperation<void> {
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
