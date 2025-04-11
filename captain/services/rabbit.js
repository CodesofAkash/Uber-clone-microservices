const amqp = require('amqplib');

let channel, connection;

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(`${process.env.RABBIT_URL}`);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

const publishToQueue = async (queueName, message) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        await channel.assertQueue(queueName);
        channel.sendToQueue(queueName, Buffer.from(message));
        console.log(`Message sent to queue ${queueName}:`, message);
    } catch (error) {
        console.error('Error publishing to queue:', error);
    }
}

const subscribeToQueue = async (queueName, callback) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        await channel.assertQueue(queueName);
        channel.consume(queueName, (message) => {
            if (message !== null) {
                callback(message.content.toString());
                channel.ack(message);
            }
        });
        console.log(`Subscribed to queue ${queueName}`);
    } catch (error) {
        console.error('Error subscribing to queue:', error);
    }
}

module.exports = { connectRabbitMQ, publishToQueue, subscribeToQueue };