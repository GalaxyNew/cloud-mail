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

		const candidateList = [env, ctx, message?.env, ctx?.env, globalThis?.env, globalThis];
		const effectiveEnv = Object.assign(
			{},
			cfWorkersEnv || {},
			typeof globalThis !== 'undefined' ? globalThis.env : {},
			(env && typeof env === 'object') ? env : {}
		);

		for (const cand of candidateList) {
			if (!cand || typeof cand !== 'object') continue;
			if (!effectiveEnv.db) effectiveEnv.db = cand.db || cand.DB || cand.d1 || cand.D1;
			if (!effectiveEnv.kv) effectiveEnv.kv = cand.kv || cand.KV;
			if (!effectiveEnv.r2) effectiveEnv.r2 = cand.r2 || cand.R2;
		}

		console.log('EMAIL_EVENT_RECEIVED:', JSON.stringify({
			to: message?.to,
			from: message?.from,
			subject: message?.headers?.get?.('subject'),
			envKeys: env ? Object.keys(env) : null,
			ctxKeys: ctx ? Object.keys(ctx) : null,
			msgKeys: message ? Object.keys(message) : null,
			hasEnv: !!env,
			hasDb: !!effectiveEnv.db,
			hasKv: !!effectiveEnv.kv
		}));

		// If D1 binding is directly available in the worker isolate, execute directly
		if (effectiveEnv.db) {
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
		}

		// If D1 is missing in the email isolate, loopback to the Worker's HTTP API where D1 is 100% bound
		console.warn('D1 binding not injected into email isolate; invoking HTTP loopback ingest to persist email...');
		try {
			let rawContent = '';
			if (message?.raw) {
				const reader = message.raw.getReader();
				const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					rawContent += decoder.decode(value, { stream: true });
				}
				rawContent += decoder.decode();
			}

			const ingestUrl = 'https://e.tv987.shop/api/test/run-real-email';
			const resp = await fetch(ingestUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: message?.to || '',
					from: message?.from || '',
					subject: message?.headers?.get?.('subject') || '',
					rawContent: rawContent
				})
			});

			const result = await resp.json().catch(() => ({}));
			console.log('HTTP loopback ingest response:', JSON.stringify(result));
			if (result.rejectReason && typeof message?.setReject === 'function') {
				message.setReject(result.rejectReason);
			}
			return;
		} catch (loopbackErr) {
			console.error('HTTP loopback ingest failed:', loopbackErr);
			return await email(message, effectiveEnv, ctx);
		}
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
