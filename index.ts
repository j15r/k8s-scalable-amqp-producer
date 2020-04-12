import Application = require('koa');
import * as Amqp from 'amqp-ts';

const app = new Application();

const port = process.env.NODE_PORT;
const amqpConnectionString = process.env.AMQP_CONNECTION_STRING;
const messageInterval = Number(process.env.MESSAGE_INTERVAL);

app.on('error', (err, ctx) => {
    console.error('An error occurred: ', err);
});

app.listen(port, async () => {
    console.log('Loadgen is running');

    await initAmqpConnection();
});

/**
 * Initialize connection with RabbitMQ and start sending message to exchange
 */
async function initAmqpConnection() {
    console.log('Initializing RabbitMQ connection');
    const connection = new Amqp.Connection(amqpConnectionString);

    connection.on('error_connection', (err: any) => {
        console.log('Error while connecting to RabbitMQ', err);
        process.exit(0);
    });

    connection.on('trying_connect', () => {
        process.exit(0);
    });

    const exchange = connection.declareExchange('exchange');
    const queue = connection.declareQueue('transactions');
    await queue.bind(exchange);
    await queue.activateConsumer((message: Amqp.Message) => {
        console.log('Message received: ' + message.getContent());
    });

    connection.completeConfiguration().then(() => {
        console.log('Successfully connected to RabbitMQ');
        setInterval(() => {
            console.log('Send new message');
            const msg = new Amqp.Message('Test');
            exchange.send(msg);
        }, messageInterval);
    }).error((err: any) => {
        console.log('Error while configuring RabbitMQ connection ', err);
    });
}
