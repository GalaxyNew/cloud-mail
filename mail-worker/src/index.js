import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from './service/oauth-service';
import analysisService from './service/analysis-service';

let cfWorkersEnv = null;
try {
	const mod = await import('cloudflare:workers');
	cfWorkersEnv = mod?.env;
} catch (e) {}

export default {
	async fetch(req, env, ctx) {
		if (env && typeof globalThis !== 'undefined') {
			globalThis.env = Object.assign(globalThis.env || {}, env);
			if (env.db) globalThis.db = env.db;
			if (env.kv) globalThis.kv = env.kv;
			if (env.r2) globalThis.r2 = env.r2;
		}

		const url = new URL(req.url);

		if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/public/')) {
			if (url.pathname.startsWith('/api/')) {
				url.pathname = url.pathname.replace('/api', '');
			}
			req = new Request(url.toString(), req);
			return app.fetch(req, env, ctx);
		}

		if (['/static/', '/attachments/'].some(p => url.pathname.startsWith(p))) {
			return await kvObjService.toObjResp({ env }, url.pathname.substring(1));
		}

		return env.assets.fetch(req);
	},
	async email(message, env, ctx) {
		if (env && typeof globalThis !== 'undefined') {
			globalThis.env = Object.assign(globalThis.env || {}, env);
			if (env.db) globalThis.db = env.db;
			if (env.kv) globalThis.kv = env.kv;
			if (env.r2) globalThis.r2 = env.r2;
		}
		const effectiveEnv = Object.assign(
			{},
			cfWorkersEnv || {},
			typeof globalThis !== 'undefined' ? globalThis.env : {},
			(env && typeof env === 'object') ? env : {}
		);
		if (!effectiveEnv.db && typeof globalThis !== 'undefined') effectiveEnv.db = globalThis.db || cfWorkersEnv?.db;
		if (!effectiveEnv.kv && typeof globalThis !== 'undefined') effectiveEnv.kv = globalThis.kv || cfWorkersEnv?.kv;
		if (!effectiveEnv.r2 && typeof globalThis !== 'undefined') effectiveEnv.r2 = globalThis.r2 || cfWorkersEnv?.r2;

		console.log('EMAIL_EVENT_RECEIVED:', JSON.stringify({
			to: message?.to,
			from: message?.from,
			subject: message?.headers?.get?.('subject'),
			hasEnv: !!env,
			hasDb: !!effectiveEnv.db,
			hasKv: !!effectiveEnv.kv
		}));

		try {
			if (effectiveEnv.kv) {
				await effectiveEnv.kv.put('last_incoming_email', JSON.stringify({
					time: new Date().toISOString(),
					to: message?.to || '',
					from: message?.from || '',
					subject: message?.headers?.get?.('subject') || 'index_received'
				})).catch(() => {});
			}
		} catch (e) {}
		return await email(message, effectiveEnv, ctx);
	},
	async scheduled(c, env, ctx) {
		if (c.cron === '*/30 * * * *') {
			await analysisService.refreshEchartsCache({ env });
			return;
		}

		await verifyRecordService.clearRecord({ env });
		await userService.resetDaySendCount({ env });
		await emailService.completeReceiveAll({ env });
		await emailService.autoClean({ env });
		await analysisService.refreshEchartsCache({ env });
		await oauthService.clearNoBindOathUser({ env });
	},
};
