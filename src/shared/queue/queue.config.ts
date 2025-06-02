export const queueConfig = {
  name: 'main_queue',
  urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672'],
  queue: 'main_queue',

  queueOptions: {
    durable: true,
  },
};
