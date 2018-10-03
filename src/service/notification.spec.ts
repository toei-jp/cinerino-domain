// tslint:disable:no-implicit-dependencies
/**
 * 通知サービステスト
 */
// tslint:disable-next-line:no-require-imports
import sgMail = require('@sendgrid/mail');
import { ACCEPTED, BAD_REQUEST, OK } from 'http-status';
import * as nock from 'nock';
import * as assert from 'power-assert';
import * as sinon from 'sinon';
import * as domain from '../index';

const LINE_NOTIFY_URL_BASE_PATH = 'https://notify-api.line.me';
const LINE_NOTIFY_URI = '/api/notify';
let sandbox: sinon.SinonSandbox;

before(() => {
    sandbox = sinon.createSandbox();
});

describe('report2developers()', () => {
    beforeEach(() => {
        process.env.LINE_NOTIFY_URL = `${LINE_NOTIFY_URL_BASE_PATH}${LINE_NOTIFY_URI}`;
        process.env.DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN = 'accessToken';
        nock.cleanAll();
        sandbox.restore();
    });

    afterEach(() => {
        delete process.env.LINE_NOTIFY_URL;
        delete process.env.DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN;
    });

    it('LINE Notifyのアクセストークンを環境変数に未設定であれば、エラーになるはず', async () => {
        delete process.env.DEVELOPER_LINE_NOTIFY_ACCESS_TOKEN;

        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).reply(OK, {});
        const imageThumbnail = 'https://example.com';
        const imageFullsize = 'https://example.com';

        const result = await domain.service.notification.report2developers('', '', imageThumbnail, imageFullsize)()
            .catch((err) => err);

        assert(result instanceof Error);
        assert(!scope.isDone());
    });

    it('LINE Notifyが200を返せば、エラーにならないはず', async () => {
        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).reply(OK, {});
        const imageThumbnail = 'https://example.com';
        const imageFullsize = 'https://example.com';

        const result = await domain.service.notification.report2developers('', '', imageThumbnail, imageFullsize)();

        assert.equal(result, undefined);
        assert(scope.isDone());
    });

    it('LINE Notifyの200を返さなければ、エラーになるはず', async () => {
        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).reply(BAD_REQUEST, { message: 'message' });

        const result = await domain.service.notification.report2developers('', '')()
            .catch((err) => err);

        assert(result instanceof Error);
        assert(scope.isDone());
    });

    it('LINE Notifyの状態が正常でなければ、エラーになるはず', async () => {
        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).replyWithError(new Error('lineError'));

        const result = await domain.service.notification.report2developers('', '')()
            .catch((err) => err);
        assert(result instanceof Error);
        assert(scope.isDone());
    });

    it('imageThumbnailがURLでなければ、エラーになるはず', async () => {
        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).reply(OK);
        const imageThumbnail = 'invalidUrl';

        const result = await domain.service.notification.report2developers('', '', imageThumbnail)()
            .catch((err) => err);

        assert(result instanceof domain.factory.errors.Argument);
        assert(!scope.isDone());
    });

    it('imageFullsizeがURLでなければ、エラーになるはず', async () => {
        const scope = nock(LINE_NOTIFY_URL_BASE_PATH).post(LINE_NOTIFY_URI).reply(OK);
        const imageThumbnail = 'https://example.com';
        const imageFullsize = 'invalidUrl';

        const result = await domain.service.notification.report2developers('', '', imageThumbnail, imageFullsize)()
            .catch((err) => err);

        assert(result instanceof domain.factory.errors.Argument);
        assert(!scope.isDone());
    });
});

describe('sendEmailMessage()', () => {
    afterEach(() => {
        sandbox.restore();
    });

    it('SendGridの状態が正常であればエラーにならないはず', async () => {
        const sendEamilMessageActionAttributets = {
            typeOf: domain.factory.actionType.SendAction,
            object: {
                identifier: 'identifier',
                sender: {},
                toRecipient: {}
            }
        };
        const sendResponse = [{ statusCode: ACCEPTED }];
        const action = {
            id: 'actionId',
            typeOf: domain.factory.actionType.SendAction
        };
        const actionRepo = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(actionRepo).expects('complete').once().resolves(action);
        sandbox.mock(sgMail).expects('send').once().resolves(sendResponse);

        const result = await domain.service.notification.sendEmailMessage(<any>sendEamilMessageActionAttributets)({ action: actionRepo });

        assert.equal(result, undefined);
        sandbox.verify();
    });

    it('SendGridAPIのステータスコードがACCEPTEDでなｋれば、エラーになるはず', async () => {

        const sendEamilMessageActionAttributets = {
            typeOf: domain.factory.actionType.SendAction,
            object: {
                identifier: 'identifier',
                sender: {},
                toRecipient: {}
            }
        };
        const sendResponse = [{ statusCode: BAD_REQUEST }];
        const action = {
            id: 'actionId',
            typeOf: domain.factory.actionType.SendAction
        };
        const actionRepo = new domain.repository.Action(domain.mongoose.connection);

        sandbox.mock(actionRepo).expects('start').once().resolves(action);
        sandbox.mock(actionRepo).expects('giveUp').once().resolves(action);
        sandbox.mock(actionRepo).expects('complete').never();
        sandbox.mock(sgMail).expects('send').once().resolves(sendResponse);

        const result = await domain.service.notification.sendEmailMessage(<any>sendEamilMessageActionAttributets)({ action: actionRepo })
            .catch((err) => err);

        assert(result instanceof Error);
        sandbox.verify();
    });
});
