import * as Joi from 'joi';

interface EnvsSchema {
  frontendUrl: string;
  database: {
    port: number;
    host: string;
    password: string;
    name: string;
    user: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
  };
  redis: {
    url: string;
    ttl: number;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
    priceId: string;
    checkoutSuccessUrl: string;
    checkoutCancelUrl: string;
  };
  port: number;
  nodeEnv: string;
  discordWebhookUrl: string;
  adminEmail: string;
  adminPassword: string;
}

const envsSchema = Joi.object({
  FRONTEND_URL: Joi.string().required(),
  PORT: Joi.number().required(),
  NODE_ENV: Joi.string().required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  REDIS_TTL: Joi.number().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_PRICE_ID: Joi.string().required(),
  STRIPE_CHECKOUT_SUCCESS_URL: Joi.string().required(),
  STRIPE_CHECKOUT_CANCEL_URL: Joi.string().required(),
  DISCORD_WEBHOOK_URL: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),
}).unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Configuration error: ${error.message}`);
}

export const envs: EnvsSchema = {
  frontendUrl: value.FRONTEND_URL,
  database: {
    port: value.DATABASE_PORT,
    host: value.DATABASE_HOST,
    password: value.DATABASE_PASSWORD,
    name: value.DATABASE_NAME,
    user: value.DATABASE_USER,
  },
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    refreshSecret: value.JWT_REFRESH_SECRET,
  },
  redis: {
    url: value.REDIS_URL,
    ttl: value.REDIS_TTL,
  },
  stripe: {
    secretKey: value.STRIPE_SECRET_KEY,
    webhookSecret: value.STRIPE_WEBHOOK_SECRET,
    priceId: value.STRIPE_PRICE_ID,
    checkoutSuccessUrl: value.STRIPE_CHECKOUT_SUCCESS_URL,
    checkoutCancelUrl: value.STRIPE_CHECKOUT_CANCEL_URL,
  },
  port: value.PORT,
  nodeEnv: value.NODE_ENV,
  discordWebhookUrl: value.DISCORD_WEBHOOK_URL,
  adminEmail: value.ADMIN_EMAIL,
  adminPassword: value.ADMIN_PASSWORD,
};
