import app from '../hono/hono';
import orm from '../entity/orm';
import user from '../entity/user';
import account from '../entity/account';
import email from '../entity/email';
import { desc, eq, and } from 'drizzle-orm';
import settingService from '../service/setting-service';
import emailService from '../service/email-service';
import accountService from '../service/account-service';
import emailUtils from '../utils/email-utils';
import { emailConst, isDel } from '../const/entity-const';

app.get('/test/diag', async (c) => {
	try {
		const userList = await orm(c).select({ userId: user.userId, email: user.email, type: user.type }).from(user).all();
		const accountList = await orm(c).select({ accountId: account.accountId, email: account.email, userId: account.userId, allReceive: account.allReceive, isDel: account.isDel }).from(account).all();
		const emailList = await orm(c).select({
			emailId: email.emailId,
			toEmail: email.toEmail,
			sendEmail: email.sendEmail,
			subject: email.subject,
			userId: email.userId,
			accountId: email.accountId,
			type: email.type,
			status: email.status,
			isDel: email.isDel,
			createTime: email.createTime
		}).from(email).orderBy(desc(email.emailId)).limit(15).all();

		let kvTarget = null;
		let lastIncoming = null;
		let lastError = null;
		try {
			if (c.env.kv) {
				kvTarget = await c.env.kv.get('generator_target_user_id');
				lastIncoming = await c.env.kv.get('last_incoming_email');
				lastError = await c.env.kv.get('last_email_error');
			}
		} catch (e) {}

		let settingRow = null;
		try {
			settingRow = await settingService.query(c);
		} catch (e) {}

		return c.json({
			success: true,
			kvTarget,
			lastIncoming: lastIncoming ? JSON.parse(lastIncoming) : null,
			lastError: lastError ? JSON.parse(lastError) : null,
			setting: {
				receive: settingRow?.receive,
				noRecipient: settingRow?.noRecipient,
				domainList: settingRow?.domainList,
				generatorTargetUserId: settingRow?.generatorTargetUserId
			},
			users: userList,
			accounts: accountList,
			recentEmails: emailList
		});
	} catch (err) {
		return c.json({ success: false, error: err.stack || err.message });
	}
});

app.get('/test/enable-all-receive', async (c) => {
	try {
		await orm(c).update(account).set({ allReceive: 1 }).run();
		const updated = await orm(c).select({ accountId: account.accountId, email: account.email, allReceive: account.allReceive }).from(account).all();
		return c.json({ success: true, updated });
	} catch (err) {
		return c.json({ success: false, error: err.message });
	}
});

app.post('/test/simulate-receive', async (c) => {
	try {
		const body = await c.req.json();
		const toAddress = (body.to || 'sp@tv987.shop').toLowerCase().trim();
		const fromAddress = body.from || 'test@sender.com';
		const subject = body.subject || '测试模拟邮件';
		const text = body.text || '这是一封测试邮件';

		let accountRow = await accountService.selectByEmailIncludeDel(c, toAddress);
		let targetUserId = 2;
		if (!accountRow) {
			accountRow = await orm(c).insert(account).values({
				email: toAddress,
				name: emailUtils.getName(toAddress),
				userId: targetUserId,
				status: 0,
				allReceive: 1
			}).returning().get();
		}

		const params = {
			toEmail: toAddress,
			toName: emailUtils.getName(toAddress),
			sendEmail: fromAddress,
			name: 'Test Sender',
			subject: subject,
			code: '',
			content: `<p>${text}</p>`,
			text: text,
			cc: '[]',
			bcc: '[]',
			recipient: JSON.stringify([{ address: toAddress, name: '' }]),
			inReplyTo: '',
			relation: '',
			messageId: `sim_${Date.now()}@tv987.shop`,
			userId: accountRow.userId,
			accountId: accountRow.accountId,
			isDel: isDel.NORMAL,
			status: emailConst.status.RECEIVE
		};

		const emailRow = await orm(c).insert(email).values(params).returning().get();
		return c.json({ success: true, createdEmail: emailRow });
	} catch (err) {
		return c.json({ success: false, error: err.stack || err.message });
	}
});

app.get('/test/inbox-test/:userId', async (c) => {
	try {
		const userId = Number(c.req.param('userId'));
		const accountRow = await orm(c).select().from(account).where(and(eq(account.userId, userId), eq(account.isDel, 0))).limit(1).get();
		if (!accountRow) return c.json({ success: false, message: 'no account' });
		const res = await emailService.list(c, {
			accountId: accountRow.accountId,
			allReceive: accountRow.allReceive,
			size: 10,
			type: 0
		}, userId);
		return c.json({
			success: true,
			userId,
			account: accountRow.email,
			allReceive: accountRow.allReceive,
			total: res.total,
			list: res.list.map(e => ({ emailId: e.emailId, toEmail: e.toEmail, subject: e.subject, sendEmail: e.sendEmail }))
		});
	} catch (err) {
		return c.json({ success: false, error: err.stack || err.message });
	}
});
