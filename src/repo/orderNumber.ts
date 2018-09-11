import * as createDebug from 'debug';
import * as moment from 'moment-timezone';
import * as redis from 'redis';
import * as util from 'util';

import * as factory from '../factory';

const debug = createDebug('cinerino-domain:repository');

/**
 * 注文番号Redisリポジトリー
 */
export class RedisRepository {
    public static REDIS_KEY_PREFIX: string = 'cinerino:orderNumber';
    public readonly redisClient: redis.RedisClient;
    constructor(redisClient: redis.RedisClient) {
        this.redisClient = redisClient;
    }
    /**
     * 発行する
     * 注文日時と販売者ごとに注文数をカウントして、ユニークな注文番号を発行します。
     */
    public async publish(params: {
        /**
         * 注文日時
         */
        orderDate: Date;
        /**
         * 販売者タイプ
         */
        sellerType: factory.organizationType;
        /**
         * 販売者枝番号(劇場枝番号)
         */
        sellerBranchCode: string;
    }): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            // 注文番号接頭辞は日付と販売者枝番号
            const orderNumberPrefix = util.format(
                '%s%s-%s',
                // tslint:disable-next-line:no-magic-numbers
                params.sellerType.slice(0, 2).toUpperCase(), // 販売者タイプの頭２文字
                params.sellerBranchCode,
                moment(params.orderDate).tz('Asia/Tokyo').format('YYMMDD')
            );
            const now = moment();
            // 一日ごとにカウントアップするので、データ保管期間は一日あれば十分
            const TTL = moment(now).add(1, 'day').diff(now, 'seconds');
            debug(`TTL:${TTL} seconds`);
            const key = util.format(
                '%s:%s',
                RedisRepository.REDIS_KEY_PREFIX,
                orderNumberPrefix
            );
            this.redisClient.multi()
                .incr(key, debug)
                .expire(key, TTL)
                .exec((err, results) => {
                    debug('results:', results);
                    // tslint:disable-next-line:no-single-line-block-comment
                    /* istanbul ignore if: please write tests */
                    if (err instanceof Error) {
                        reject(err);
                    } else {
                        // tslint:disable-next-line:no-single-line-block-comment
                        /* istanbul ignore else: please write tests */
                        if (Number.isInteger(results[0])) {
                            const no: number = results[0];
                            debug('no incremented.', no);
                            resolve(util.format(
                                '%s-%s',
                                orderNumberPrefix,
                                // tslint:disable-next-line:no-magic-numbers
                                (`000000${no}`).slice(-6) // 一販売者につき一日あたり最大100000件以内の注文想定
                            ));
                        } else {
                            // 基本的にありえないフロー
                            reject(new factory.errors.ServiceUnavailable('Order number not published'));
                        }
                    }
                });
        });
    }
}
