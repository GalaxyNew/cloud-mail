import BizError from '../error/biz-error';
import orm from '../entity/orm';
import { v4 as uuidv4 } from 'uuid';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import saltHashUtils from '../utils/crypto-utils';
import cryptoUtils from '../utils/crypto-utils';
import emailUtils from '../utils/email-utils';
import roleService from './role-service';
import verifyUtils from '../utils/verify-utils';
import { t } from '../i18n/i18n';
import reqUtils from '../utils/req-utils';
import dayjs from 'dayjs';
import { isDel, roleConst, emailConst } from '../const/entity-const';
import email from '../entity/email';
import account from '../entity/account';
import user from '../entity/user';
import userService from './user-service';
import accountService from './account-service';
import settingService from './setting-service';
import KvConst from '../const/kv-const';
import jwtUtils from '../utils/jwt-utils';
import constant from '../const/constant';

const publicService = {

	async emailList(c, params) {

		let { toEmail, content, subject, sendName, sendEmail, timeSort, num, size, type , isDel } = params

		const query = orm(c).select({
				emailId: email.emailId,
				sendEmail: email.sendEmail,
				sendName: email.name,
				subject: email.subject,
				toEmail: email.toEmail,
				toName: email.toName,
				type: email.type,
				createTime: email.createTime,
				content: email.content,
				text: email.text,
				isDel: email.isDel,
		}).from(email)

		if (!size) {
			size = 20
		}

		if (!num) {
			num = 1
		}

		size = Number(size);
		num = Number(num);

		num = (num - 1) * size;

		let conditions = []

		if (toEmail) {
			conditions.push(sql`${email.toEmail} COLLATE NOCASE LIKE ${toEmail}`)
		}

		if (sendEmail) {
			conditions.push(sql`${email.sendEmail} COLLATE NOCASE LIKE ${sendEmail}`)
		}

		if (sendName) {
			conditions.push(sql`${email.name} COLLATE NOCASE LIKE ${sendName}`)
		}

		if (subject) {
			conditions.push(sql`${email.subject} COLLATE NOCASE LIKE ${subject}`)
		}

		if (content) {
			conditions.push(sql`${email.content} COLLATE NOCASE LIKE ${content}`)
		}

		if (type || type === 0) {
			conditions.push(eq(email.type, type))
		}

		if (isDel || isDel === 0) {
			conditions.push(eq(email.isDel, isDel))
		}

		if (conditions.length === 1) {
			query.where(...conditions)
		} else if (conditions.length > 1) {
			query.where(and(...conditions))
		}

		if (timeSort === 'asc') {
			query.orderBy(asc(email.emailId));
		} else {
			query.orderBy(desc(email.emailId));
		}

		return query.limit(size).offset(num);

	},

	async addUser(c, params) {
		const { list } = params;

		if (list.length === 0) return;

		for (const emailRow of list) {
			if (!verifyUtils.isEmail(emailRow.email)) {
				throw new BizError(t('notEmail'));
			}

			if (!c.env.domain.includes(emailUtils.getDomain(emailRow.email))) {
				throw new BizError(t('notEmailDomain'));
			}

			const { salt, hash } = await saltHashUtils.hashPassword(
				emailRow.password || cryptoUtils.genRandomPwd()
			);

			emailRow.salt = salt;
			emailRow.hash = hash;
		}


		const activeIp = reqUtils.getIp(c);
		const { os, browser, device } = reqUtils.getUserAgent(c);
		const activeTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

		const roleList = await roleService.roleSelectUse(c);
		const defRole = roleList.find(roleRow => roleRow.isDefault === roleConst.isDefault.OPEN);

		const userList = [];

		for (const emailRow of list) {
			let { email, hash, salt, roleName } = emailRow;
			let type = defRole.roleId;

			if (roleName) {
				const roleRow = roleList.find(role => role.name === roleName);
				type = roleRow ? roleRow.roleId : type;
			}

			const userSql = `INSERT INTO user (email, password, salt, type, os, browser, active_ip, create_ip, device, active_time, create_time)
			VALUES ('${email}', '${hash}', '${salt}', '${type}', '${os}', '${browser}', '${activeIp}', '${activeIp}', '${device}', '${activeTime}', '${activeTime}')`

			const accountSql = `INSERT INTO account (email, name, user_id)
			VALUES ('${email}', '${emailUtils.getName(email)}', 0);`;

			userList.push(c.env.db.prepare(userSql));
			userList.push(c.env.db.prepare(accountSql));

		}

		userList.push(c.env.db.prepare(`UPDATE account SET user_id = (SELECT user_id FROM user WHERE user.email = account.email) WHERE user_id = 0;`))

		try {
			await c.env.db.batch(userList);
		} catch (e) {
			if(e.message.includes('SQLITE_CONSTRAINT')) {
				throw new BizError(t('emailExistDatabase'))
			} else {
				throw e
			}
		}

	},

	async genToken(c, params) {

		await this.verifyUser(c, params)

		const uuid = uuidv4();

		await c.env.kv.put(KvConst.PUBLIC_KEY, uuid);

		return {token: uuid}
	},

	async verifyUser(c, params) {

		const { email, password } = params

		const userRow = await userService.selectByEmailIncludeDel(c, email);

		if (email !== c.env.admin) {
			throw new BizError(t('notAdmin'));
		}

		if (!userRow || userRow.isDel === isDel.DELETE) {
			throw new BizError(t('notExistUser'));
		}

		if (!await cryptoUtils.verifyPassword(password, userRow.salt, userRow.password)) {
			throw new BizError(t('IncorrectPwd'));
		}
	},

	async generatorCreateAccount(c, params) {
		let { email } = params;
		if (!email) {
			throw new BizError(t('emptyEmail'));
		}
		email = email.trim().toLowerCase();
		if (!verifyUtils.isEmail(email)) {
			throw new BizError(t('notEmail'));
		}

		// 0. Check if request carries logged-in user JWT token
		let tokenUserId = 0;
		const jwt = c.req.header(constant.TOKEN_HEADER);
		if (jwt) {
			try {
				const tokenRes = await jwtUtils.verifyToken(c, jwt);
				if (tokenRes && tokenRes.userId) {
					tokenUserId = Number(tokenRes.userId);
				}
			} catch (e) {
				// ignore invalid/expired token
			}
		}

		// 1. Get generatorTargetUserId from KV/setting
		const settingRow = await settingService.query(c);
		let targetUserId = 0;
		const kvTarget = await c.env.kv.get('generator_target_user_id');
		if (kvTarget && Number(kvTarget) > 0) {
			targetUserId = Number(kvTarget);
		} else if (settingRow.generatorTargetUserId && Number(settingRow.generatorTargetUserId) > 0) {
			targetUserId = Number(settingRow.generatorTargetUserId);
		} else if (tokenUserId > 0) {
			// If not explicitly configured in settings, use the currently logged-in user!
			targetUserId = tokenUserId;
		}

		// 2. Resolve target user
		let targetUser = null;
		if (targetUserId > 0) {
			targetUser = await userService.selectById(c, targetUserId);
		}

		// Fallback to admin user if not found
		if (!targetUser) {
			targetUser = await userService.selectByEmail(c, c.env.admin);
			if (targetUser) {
				targetUserId = targetUser.userId;
			}
		}

		// Fallback to first normal user if admin not found
		if (!targetUser) {
			const firstUser = await orm(c).select().from(user).where(eq(user.isDel, isDel.NORMAL)).get();
			if (firstUser) {
				targetUser = firstUser;
				targetUserId = firstUser.userId;
			}
		}

		if (!targetUser) {
			throw new BizError('系统未初始化或无可用用户账号');
		}

		// 3. Check if account already exists
		const existAccount = await accountService.selectByEmailIncludeDel(c, email);
		if (existAccount) {
			if (existAccount.isDel === isDel.DELETE) {
				await orm(c).update(account).set({ isDel: isDel.NORMAL, userId: targetUserId, allReceive: 1 }).where(eq(account.accountId, existAccount.accountId)).run();
				await orm(c).update(account).set({ allReceive: 1 }).where(and(eq(account.userId, targetUserId), eq(account.isDel, isDel.NORMAL))).run();
				return { accountId: existAccount.accountId, email, userId: targetUserId, targetUserEmail: targetUser.email, restored: true };
			}
			await orm(c).update(account).set({ allReceive: 1 }).where(and(eq(account.userId, targetUserId), eq(account.isDel, isDel.NORMAL))).run();
			return { accountId: existAccount.accountId, email, userId: existAccount.userId, targetUserEmail: targetUser.email, exists: true };
		}

		// 4. Insert into account table with allReceive: 1
		const newAccount = await orm(c).insert(account).values({
			email: email,
			name: emailUtils.getName(email),
			userId: targetUserId,
			status: 0,
			allReceive: 1
		}).returning().get();

		// Ensure target user's primary and other accounts have allReceive enabled
		try {
			await orm(c).update(account).set({ allReceive: 1 }).where(and(eq(account.userId, targetUserId), eq(account.isDel, isDel.NORMAL))).run();
		} catch (allRecErr) {
			console.warn('Set allReceive warning in generatorCreateAccount:', allRecErr);
		}

		// Auto-rescue any previously received unclaimed emails for this address
		try {
			await orm(c).update(email)
				.set({ userId: targetUserId, accountId: newAccount.accountId, status: emailConst.status.RECEIVE })
				.where(and(
					sql`${email.toEmail} COLLATE NOCASE = ${email}`,
					eq(email.status, emailConst.status.NOONE)
				)).run();
		} catch (linkErr) {
			console.warn('Failed to link unclaimed emails:', linkErr);
		}

		return {
			accountId: newAccount.accountId,
			email: newAccount.email,
			userId: targetUserId,
			targetUserEmail: targetUser.email
		};
	}

}

export default publicService;
