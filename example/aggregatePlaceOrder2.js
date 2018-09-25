const domain = require('../lib');
const moment = require('moment');

async function main() {
    await domain.mongoose.connect(process.env.MONGOLAB_URI);
    const telemetryRepo = new domain.repository.Telemetry(domain.mongoose.connection);
    const transactionRepo = new domain.repository.Transaction(domain.mongoose.connection);
    setInterval(
        async () => {
            const measureThrough = moment(moment().format('YYYY-MM-DDTHH:mm:00Z')).toDate();
            const measureFrom = moment(measureThrough).add(-1, 'minute').toDate();
            await domain.service.report.telemetry.aggregatePlaceOrder({ measureFrom, measureThrough })({
                telemetry: telemetryRepo,
                transaction: transactionRepo
            });
        },
        60000
    );
}

main().then(() => {
    console.log('success!');
}).catch(console.error);
