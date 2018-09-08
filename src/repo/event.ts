
import * as factory from '@toei-jp/cinerino-factory';
import { Connection } from 'mongoose';
import eventModel from './mongoose/model/event';

/**
 * イベントリポジトリー
 */
export class MongoRepository {
    public readonly eventModel: typeof eventModel;
    constructor(connection: Connection) {
        this.eventModel = connection.model(eventModel.modelName);
    }
    public static CREATE_SCREENING_EVENT_MONGO_CONDITIONS(params: factory.chevre.event.screeningEvent.ISearchConditions) {
        const andConditions: any[] = [
            {
                typeOf: factory.chevre.eventType.ScreeningEvent
            }
        ];
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.name !== undefined) {
            andConditions.push({
                $or: [
                    { 'name.ja': new RegExp(params.name, 'i') },
                    { 'name.en': new RegExp(params.name, 'i') }
                ]
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.superEvent !== undefined) {
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (Array.isArray(params.superEvent.locationBranchCodes)) {
                andConditions.push({
                    'superEvent.location.branchCode': {
                        $exists: true,
                        $in: params.superEvent.locationBranchCodes
                    }
                });
            }
            // tslint:disable-next-line:no-single-line-block-comment
            /* istanbul ignore else */
            if (Array.isArray(params.superEvent.workPerformedIdentifiers)) {
                andConditions.push({
                    'superEvent.workPerformed.identifier': {
                        $exists: true,
                        $in: params.superEvent.workPerformedIdentifiers
                    }
                });
            }
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(params.eventStatuses)) {
            andConditions.push({
                eventStatus: { $in: params.eventStatuses }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.inSessionFrom !== undefined) {
            andConditions.push({
                endDate: { $gt: params.inSessionFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.inSessionThrough !== undefined) {
            andConditions.push({
                startDate: { $lt: params.inSessionThrough }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.startFrom !== undefined) {
            andConditions.push({
                startDate: { $gte: params.startFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.startThrough !== undefined) {
            andConditions.push({
                startDate: { $lt: params.startThrough }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.endFrom !== undefined) {
            andConditions.push({
                endDate: { $gte: params.endFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.endThrough !== undefined) {
            andConditions.push({
                endDate: { $lt: params.endThrough }
            });
        }

        return andConditions;
    }
    /**
     * イベントを保管する
     */
    public async save<T extends factory.chevre.eventType>(params: factory.chevre.event.IEvent<T>) {
        await this.eventModel.findOneAndUpdate(
            {
                _id: params.id,
                typeOf: params.typeOf
            },
            params,
            { new: true, upsert: true }
        ).exec();
    }
    public async countScreeningEvents(params: factory.chevre.event.screeningEvent.ISearchConditions): Promise<number> {
        const conditions = MongoRepository.CREATE_SCREENING_EVENT_MONGO_CONDITIONS(params);

        return this.eventModel.countDocuments(
            { $and: conditions }
        ).setOptions({ maxTimeMS: 10000 })
            .exec();
    }
    /**
     * 上映イベントを検索する
     */
    public async searchScreeningEvents(
        params: factory.chevre.event.screeningEvent.ISearchConditions
    ): Promise<factory.chevre.event.screeningEvent.IEvent[]> {
        const conditions = MongoRepository.CREATE_SCREENING_EVENT_MONGO_CONDITIONS(params);
        const query = this.eventModel.find(
            { $and: conditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        );
        if (params.limit !== undefined && params.page !== undefined) {
            query.limit(params.limit).skip(params.limit * (params.page - 1));
        }

        return query.sort({ startDate: 1 })
            .setOptions({ maxTimeMS: 10000 })
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
    }
    /**
     * IDでイベントを取得する
     */
    public async findById<T extends factory.chevre.eventType>(params: {
        typeOf: T;
        id: string;
    }): Promise<factory.chevre.event.IEvent<T>> {
        const event = await this.eventModel.findOne(
            {
                typeOf: params.typeOf,
                _id: params.id
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec();
        if (event === null) {
            throw new factory.errors.NotFound('Event');
        }

        return event.toObject();
    }
}
