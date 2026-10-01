import PostalMime from 'postal-mime';
import emailService from '../service/email-service';
import accountService from '../service/account-service';
import settingService from '../service/setting-service';
import attService from '../service/att-service';
import constant from '../const/constant';
import fileUtils from '../utils/file-utils';
import { emailConst, isDel, settingConst } from '../const/entity-const';
import emailUtils from '../utils/email-utils';
import roleService from '../service/role-service';
import userService from '../service/user-service';
import telegramService from '../service/telegram-service';
import aiService from '../service/ai-service';
import webhookService from '../service/webhook-service';
import orm from '../entity/orm';
import accountTable from '../entity/account';
import userTable from '../entity/user';
import emailTable from '../entity/email';
import { eq, and } from 'drizzle-orm';

let cfWorkersEnv = null;
try {
	const mod = await import('cloudflare:workers');
	cfWorkersEnv = mod?.env;
} catch (e) {}

export async function email(message, env, ctx) {
	const actualEnv = Object.assign(
		{},
		cfWorkersEnv || {},
		typeof globalThis !== 'undefined' ? (globalThis.env || globalThis) : {},
		(env && typeof env === 'object') ? env : {},
		(message?.env && typeof message.env === 'object') ? message.env : {},
		(ctx?.env && typeof ctx.env === 'object') ? ctx.env : {}
	);
	if (!actualEnv.db) actualEnv.db = actualEnv.DB || cfWorkersEnv?.db || cfWorkersEnv?.DB || (typeof globalThis !== 'undefined' ? (globalThis.db || globalThis.DB || globalThis.env?.db) : null);
	if (!actualEnv.kv) actualEnv.kv = actualEnv.KV || cfWorkersEnv?.kv || cfWorkersEnv?.KV || (typeof globalThis !== 'undefined' ? (globalThis.kv || globalThis.KV || globalThis.env?.kv) : null);
	if (!actualEnv.r2) actualEnv.r2 = actualEnv.R2 || cfWorkersEnv?.r2 || cfWorkersEnv?.R2 || (typeof globalThis !== 'undefined' ? (globalThis.r2 || globalThis.R2 || globalThis.env?.r2) : null);

	const callCtx = { env: actualEnv, db: actualEnv.db, kv: actualEnv.kv, r2: actualEnv.r2, ...actualEnv };

	try {

		try {
			if (actualEnv.kv) {
				await actualEnv.kv.put('last_incoming_email', JSON.stringify({
					time: new Date().toISOString(),
					to: message?.to || '',
					from: message?.from || '',
					subject: message?.headers?.get?.('subject') || ''
				}));
			}
		} catch (kvErr) {
			console.warn('kv put incoming email err:', kvErr);
		}

		const settingData = await settingService.query(callCtx);
		const {
			receive,
			tgChatId,
			tgBotStatus,
			forwardStatus,
			forwardEmail,
			webhookStatus,
			webhookUrl,
			webhookRetry,
			webhookSecret,
			ruleEmail,
			ruleType,
			r2Domain,
			noRecipient,
			blackSubject,
			blackContent,
			blackFrom,
			aiCode,
			aiCodeFilter
		} = settingData;

		if (receive === settingConst.receive.CLOSE) {
			message.setReject('Service suspended');
			return;
		}

		const reader = message.raw.getReader();
		let content = '';
		const decoder = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			content += decoder.decode(value, { stream: true });
		}
		content += decoder.decode();

		let emailParsed;
		try {
			emailParsed = await PostalMime.parse(content);
		} catch (parseErr) {
			console.error('PostalMime parse error:', parseErr);
			emailParsed = {
				subject: message.headers?.get('subject') || '',
				from: { address: message.from, name: '' },
				to: [{ address: message.to, name: '' }],
				text: content,
				html: '',
				attachments: []
			};
		}

		const blockFlag = checkBlock(blackSubject, blackContent, blackFrom, emailParsed);

		if (blockFlag) {
			message.setReject('Message rejected');
			return;
		}

		// Normalize recipient address (lowercase, strip angle brackets/spaces)
		const rawTo = message.to || '';
		const matchedTo = rawTo.match(/[\w.+-]+@[\w.-]+/)?.[0];
		const toAddress = (matchedTo || rawTo.replace(/[<>]/g, '')).trim().toLowerCase();

		let account = null;
		try {
			account = await accountService.selectByEmailIncludeDel(callCtx, toAddress);
			if (!account) {
				const baseEmail = emailUtils.getBaseEmail(toAddress);
				if (baseEmail && baseEmail.toLowerCase() !== toAddress) {
					account = await accountService.selectByEmailIncludeDel(callCtx, baseEmail);
				}
			}
		} catch (accErr) {
			console.error('Error querying account:', accErr);
		}

		// If account not registered, auto-bind domain recipient to target user
		if (!account) {
			try {
				const toDomain = emailUtils.getDomain(toAddress).toLowerCase();
				const domainList = (settingData.domainList || []).map(d => String(d).toLowerCase());
				const envDomains = Array.isArray(actualEnv.domain) ? actualEnv.domain.map(d => String(d).toLowerCase()) : (typeof actualEnv.domain === 'string' ? [actualEnv.domain.toLowerCase()] : []);
				const isOurDomain = envDomains.includes(toDomain) || domainList.includes(toDomain) || toDomain === 'tv987.shop';

				if (isOurDomain) {
					let targetUserId = 0;
					try {
						const kvTarget = actualEnv.kv ? await actualEnv.kv.get('generator_target_user_id') : null;
						if (kvTarget && Number(kvTarget) > 0) {
							targetUserId = Number(kvTarget);
						} else if (settingData.generatorTargetUserId && Number(settingData.generatorTargetUserId) > 0) {
							targetUserId = Number(settingData.generatorTargetUserId);
						}
					} catch (kvErr) {
						console.warn('Error reading generator_target_user_id in email.js:', kvErr);
					}

					let targetUser = null;
					if (targetUserId > 0) {
						try {
							targetUser = await userService.selectByIdIncludeDel(callCtx, targetUserId);
						} catch (e) {}
					}
					if (!targetUser && actualEnv.admin) {
						try {
							targetUser = await userService.selectByEmail(callCtx, actualEnv.admin);
						} catch (e) {}
					}
					if (!targetUser) {
						try {
							targetUser = await orm(callCtx).select().from(userTable).where(eq(userTable.isDel, isDel.NORMAL)).get();
						} catch (e) {}
					}

					if (targetUser) {
						targetUserId = targetUser.userId;
						try {
							account = await orm(callCtx).insert(accountTable).values({
								email: toAddress,
								name: emailUtils.getName(toAddress),
								userId: targetUserId,
								status: 0,
								allReceive: 1
							}).returning().get();
							console.log(`Auto-created account ${toAddress} for targetUserId ${targetUserId}`);
							await orm(callCtx).update(accountTable).set({ allReceive: 1 }).where(and(eq(accountTable.userId, targetUserId), eq(accountTable.isDel, isDel.NORMAL))).run();
						} catch (cErr) {
							account = await accountService.selectByEmailIncludeDel(callCtx, toAddress);
						}
					}
				}
			} catch (bindErr) {
				console.error('Error auto-binding account in email.js:', bindErr);
			}
		}

		if (!account && noRecipient === settingConst.noRecipient.CLOSE) {
			message.setReject('Recipient not found');
			return;
		}

		let userRow = {};
		if (account && account.userId) {
			try {
				userRow = (await userService.selectByIdIncludeDel(callCtx, account.userId)) || {};
			} catch (uErr) {
				console.error('Error querying user:', uErr);
			}
		}

		// Check if recipient belongs to super admin
		const uEmail = (userRow.email || '').toLowerCase().trim();
		const adminConfig = (actualEnv.admin || '').toLowerCase().trim();
		const isAdmin = (
			userRow.userId === 1 ||
			userRow.type === 0 ||
			(adminConfig && (uEmail === adminConfig || uEmail.startsWith(adminConfig + '@') || emailUtils.getName(uEmail) === adminConfig))
		);

		if (account && !isAdmin) {
			try {
				let roleRow = await roleService.selectByUserId(callCtx, account.userId);
				let banEmail = roleRow?.banEmail;
				let availDomain = roleRow?.availDomain;

				if (availDomain && !roleService.hasAvailDomainPerm(availDomain, toAddress)) {
					message.setReject('The recipient is not authorized to use this domain.');
					return;
				}

				const fromAddr = emailParsed.from?.address || message.from || '';
				if (banEmail && roleService.isBanEmail(banEmail, fromAddr)) {
					message.setReject('The recipient is disabled from receiving emails.');
					return;
				}
			} catch (roleErr) {
				console.error('Role check failed, continuing email receipt:', roleErr);
			}
		}

		if (!emailParsed.to || !Array.isArray(emailParsed.to) || emailParsed.to.length === 0) {
			emailParsed.to = [{ address: toAddress, name: emailUtils.getName(toAddress) }];
		}

		const toName = emailParsed.to.find(item => (item.address || '').toLowerCase() === toAddress)?.name || '';
		let code = '';
		try {
			code = await aiService.extractCode(callCtx, emailParsed, { aiCode, aiCodeFilter });
		} catch (aiErr) {
			console.error('AI code extraction error:', aiErr);
		}

		const fromAddress = emailParsed.from?.address || message.from || '';
		const fromName = emailParsed.from?.name || (fromAddress ? emailUtils.getName(fromAddress) : '');

		const params = {
			toEmail: toAddress,
			toName: toName || '',
			sendEmail: fromAddress,
			name: fromName || '',
			subject: emailParsed.subject || '',
			code: code || '',
			content: emailParsed.html || '',
			text: emailParsed.text || '',
			cc: emailParsed.cc ? JSON.stringify(emailParsed.cc) : '[]',
			bcc: emailParsed.bcc ? JSON.stringify(emailParsed.bcc) : '[]',
			recipient: JSON.stringify(emailParsed.to),
			inReplyTo: emailParsed.inReplyTo || '',
			relation: emailParsed.references || '',
			messageId: emailParsed.messageId || '',
			userId: account ? account.userId : 1,
			accountId: account ? account.accountId : 1,
			isDel: isDel.DELETE,
			status: emailConst.status.SAVING
		};

		const attachments = [];
		const cidAttachments = [];

		for (let item of (emailParsed.attachments || [])) {
			let attachment = { ...item };
			attachment.key = constant.ATTACHMENT_PREFIX + await fileUtils.getBuffHash(attachment.content) + fileUtils.getExtFileName(item.filename || '');
			attachment.size = item.content?.length ?? item.content?.byteLength ?? 0;
			attachments.push(attachment);
			if (attachment.contentId) {
				cidAttachments.push(attachment);
			}
		}

		let emailRow = await emailService.receive(callCtx, params, cidAttachments, r2Domain);

		if (emailRow && emailRow.emailId) {
			attachments.forEach(attachment => {
				attachment.emailId = emailRow.emailId;
				attachment.userId = emailRow.userId;
				attachment.accountId = emailRow.accountId;
			});

			try {
				if (attachments.length > 0) {
					await attService.addAtt(callCtx, attachments);
				}
			} catch (e) {
				console.error('附件添加异常:', e);
			}

			emailRow = await emailService.completeReceive(callCtx, account ? emailConst.status.RECEIVE : emailConst.status.NOONE, emailRow.emailId);
		}

		if (ruleType === settingConst.ruleType.RULE && ruleEmail) {
			const emails = String(ruleEmail).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
			if (!emails.includes(toAddress)) {
				return;
			}
		}

		// 转发到TG
		if (tgBotStatus === settingConst.tgBotStatus.OPEN && tgChatId) {
			try {
				await telegramService.sendEmailToBot(callCtx, emailRow);
			} catch (tgErr) {
				console.error('转发到TG失败:', tgErr);
			}
		}

		// 转发到其他邮箱
		if (forwardStatus === settingConst.forwardStatus.OPEN && forwardEmail) {
			const emails = String(forwardEmail).split(',').map(s => s.trim()).filter(Boolean);
			await Promise.all(emails.map(async fEmail => {
				try {
					await message.forward(fEmail);
				} catch (e) {
					console.error(`转发邮箱 ${fEmail} 失败：`, e);
				}
			}));
		}

		// 转发到 Webhook
		if (webhookStatus === settingConst.webhookStatus.OPEN && webhookUrl) {
			try {
				await webhookService.sendEmail(callCtx, emailRow, webhookUrl, webhookRetry, webhookSecret);
			} catch (whErr) {
				console.error('转发到Webhook失败:', whErr);
			}
		}

	} catch (e) {
		console.error('邮件接收异常: ', e?.stack || e);
		try {
			if (actualEnv.kv) {
				await actualEnv.kv.put('last_email_error', JSON.stringify({
					time: new Date().toISOString(),
					message: e?.message || String(e),
					stack: e?.stack || ''
				}));
			}
		} catch (kvErr) {}

		// Fallback rescue: attempt basic insertion so the email is never lost
		try {
			const toAddress = (message?.to || '').toLowerCase().trim();
			const fromAddress = message?.from || '';
			const subject = message?.headers?.get?.('subject') || '（未命名主题）';
			let acc = await accountService.selectByEmailIncludeDel(callCtx, toAddress).catch(() => null);
			let fallbackUserId = acc ? acc.userId : 1;
			let fallbackAccountId = acc ? acc.accountId : 1;
			await orm(callCtx).insert(emailTable).values({
				toEmail: toAddress,
				toName: '',
				sendEmail: fromAddress,
				name: '',
				subject: subject,
				code: '',
				content: `<p>邮件内容接收提醒 (系统已自动兜底保护): ${e?.message || ''}</p>`,
				text: `邮件内容接收提醒 (系统已自动兜底保护): ${e?.message || ''}`,
				cc: '[]',
				bcc: '[]',
				recipient: JSON.stringify([{ address: toAddress, name: '' }]),
				inReplyTo: '',
				relation: '',
				messageId: `err_${Date.now()}@tv987.shop`,
				userId: fallbackUserId,
				accountId: fallbackAccountId,
				isDel: 0,
				status: 0
			}).run().catch(() => {});
		} catch (fallbackErr) {
			console.error('Fallback email rescue failed:', fallbackErr);
		}
		// Do NOT throw e, preventing Cloudflare from marking the email as Delivery Failed
	}
}

function checkBlock(blackSubjectStr, blackContentStr, blackFromStr, email) {
	try {
		const blackFromList = typeof blackFromStr === 'string' ? blackFromStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : (Array.isArray(blackFromStr) ? blackFromStr : []);
		const blackContentList = typeof blackContentStr === 'string' ? blackContentStr.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(blackContentStr) ? blackContentStr : []);
		const blackSubjectList = typeof blackSubjectStr === 'string' ? blackSubjectStr.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(blackSubjectStr) ? blackSubjectStr : []);

		const fromAddress = (email?.from?.address || '').toLowerCase();
		const fromDomain = emailUtils.getDomain(fromAddress).toLowerCase();

		for (const blackSubject of blackSubjectList) {
			if (blackSubject && email?.subject?.includes(blackSubject)) {
				return true;
			}
		}

		for (const blackContent of blackContentList) {
			if (blackContent && (email?.html?.includes(blackContent) || email?.text?.includes(blackContent))) {
				return true;
			}
		}

		for (const blackFrom of blackFromList) {
			if (blackFrom && (fromAddress === blackFrom || fromDomain === blackFrom)) {
				return true;
			}
		}

		return false;
	} catch (e) {
		console.warn('checkBlock error:', e);
		return false;
	}
}
