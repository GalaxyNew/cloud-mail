import app from '../hono/hono';
import orm from '../entity/orm';
import user from '../entity/user';
import account from '../entity/account';
import email from '../entity/email';
import { desc } from 'drizzle-orm';

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
		try {
			kvTarget = c.env.kv ? await c.env.kv.get('generator_target_user_id') : null;
		} catch (e) {}

		return c.json({
			success: true,
			kvTarget,
			users: userList,
			accounts: accountList,
			recentEmails: emailList
		});
	} catch (err) {
		return c.json({ success: false, error: err.stack || err.message });
	}
});
