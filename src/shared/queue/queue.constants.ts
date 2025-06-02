export const QUEUE_NAMES = {
  EMAIL: 'email_queue',
  NOTIFICATION: 'notification_queue',
} as const;

export const ROUTING_KEYS = {
  WELCOME_EMAIL: 'email.welcome',
  ORDER_CONFIRMATION: 'email.order_confirmation',
  NOTIFICATION: 'notification.new',
} as const;
