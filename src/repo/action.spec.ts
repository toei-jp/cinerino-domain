// tslint:disable:no-implicit-dependencies
/**
 * アクションリポジトリーテスト
 */

import { } from 'mocha';
import * as assert from 'power-assert';
import * as sinon from 'sinon';
import { } from 'sinon-mongoose';
// tslint:disable-next-line:no-require-imports no-var-requires
require('sinon-mongoose');
import * as domain from '../index';

let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.createSandbox();
});

describe('start()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションオブジェクトが返却されるはず', async () => {
        const params = {};

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('create').once()
            .resolves(new repository.actionModel());

        const result = await repository.start(<any>params);

        assert(typeof result, 'object');
        sandbox.verify();
    });
});

describe('complete()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクトが返却されるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };
        const actionResult = {};

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new repository.actionModel());

        const result = await repository.complete(action.typeOf, action.id, actionResult);

        assert(typeof result, 'object');
        sandbox.verify();
    });

    it('アクションが存在しなければNotFoundエラーとなるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };
        const actionResult = {};

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(null);

        const result = await repository.complete(action.typeOf, action.id, actionResult).catch((err) => err);

        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('cancel()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクトが返却されるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new repository.actionModel());

        const result = await repository.cancel(action.typeOf, action.id);

        assert(typeof result, 'object');
        sandbox.verify();
    });

    it('アクションが存在しなければNotFoundエラーとなるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(null);

        const result = await repository.cancel(action.typeOf, action.id).catch((err) => err);

        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('giveUp()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクトが返却されるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };
        const error = {};

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(new repository.actionModel());

        const result = await repository.giveUp(action.typeOf, action.id, error);

        assert(typeof result, 'object');
        sandbox.verify();
    });

    it('アクションが存在しなければNotFoundエラーとなるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };
        const error = {};

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOneAndUpdate').once()
            .chain('exec').resolves(null);

        const result = await repository.giveUp(action.typeOf, action.id, error).catch((err) => err);

        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('findById()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクトが返却されるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOne').once()
            .chain('exec').resolves(new repository.actionModel());

        const result = await repository.findById(action.typeOf, action.id);

        assert(typeof result, 'object');
        sandbox.verify();
    });

    it('アクションが存在しなければNotFoundエラーとなるはず', async () => {
        const action = { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' };

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('findOne').once()
            .chain('exec').resolves(null);

        const result = await repository.findById(action.typeOf, action.id).catch((err) => err);

        assert(result instanceof domain.factory.errors.NotFound);
        sandbox.verify();
    });
});

describe('findAuthorizeByTransactionId()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクト配列が返却されるはず', async () => {
        const transactionId = 'transactionId';
        const actions = [
            { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' },
            { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' }
        ];

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('find').once()
            .chain('exec').resolves(actions.map((a) => new repository.actionModel(a)));

        const result = await repository.findAuthorizeByTransactionId({ transactionId });
        assert(Array.isArray(result));
        assert.equal(result.length, actions.length);
        sandbox.verify();
    });
});

describe('findByOrderNumber()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('アクションが存在すればオブジェクト配列が返却されるはず', async () => {
        const orderNumber = 'orderNumber';
        const actions = [
            { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' },
            { typeOf: domain.factory.actionType.OrderAction, id: 'actionId' }
        ];

        const repository = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(repository.actionModel).expects('find').once()
            .chain('sort').chain('exec').resolves(actions.map((a) => new repository.actionModel(a)));

        const result = await repository.findByOrderNumber({ orderNumber });

        assert(Array.isArray(result));
        assert.equal(result.length, actions.length);
        sandbox.verify();
    });
});
