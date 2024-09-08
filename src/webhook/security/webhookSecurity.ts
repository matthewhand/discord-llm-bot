import { Request, Response, NextFunction } from 'express';
import webhookConfig from '@src/webhook/interfaces/webhookConfig';
import { redactSensitiveInfo } from '@common/redactSensitiveInfo';

export const verifyWebhookToken = (req: Request, res: Response, next: NextFunction): void => {
    const providedToken = req.headers['x-webhook-token'] as string | undefined;
    const expectedToken = webhookConfig.get('WEBHOOK_SECRET_TOKEN');

    console.debug('Provided Token:', redactSensitiveInfo('x-webhook-token', providedToken));
    console.debug('Expected Token:', redactSensitiveInfo('WEBHOOK_SECRET_TOKEN', expectedToken));

    if (!expectedToken) {
        throw new Error('WEBHOOK_SECRET_TOKEN is not defined in config');
    }

    if (!providedToken || providedToken !== expectedToken) {
        res.status(403).send('Forbidden: Invalid token');
        return;
    }

    next();
};

export const verifyIpWhitelist = (req: Request, res: Response, next: NextFunction): void => {
    const whitelistedIps = webhookConfig.get<string[]>('WEBHOOK_WHITELISTED_IPS');
    const requestIp = req.ip;

    console.debug('Request IP:', requestIp);
    console.debug('Whitelisted IPs:', whitelistedIps);

    if (!whitelistedIps || whitelistedIps.length === 0) {
        throw new Error('WEBHOOK_WHITELISTED_IPS is not defined or empty in config');
    }

    if (!whitelistedIps.includes(requestIp)) {
        res.status(403).send('Forbidden: Unauthorized IP address');
        return;
    }

    next();
};
