import KvConst from '../const/kv-const';
import setting from '../entity/setting';
import orm from '../entity/orm';
import account from '../entity/account';
import { and, eq } from 'drizzle-orm';
import { verifyRecordType, isDel } from '../const/entity-const';
import fileUtils from '../utils/file-utils';
import r2Service from './r2-service';
import constant from '../const/constant';
import BizError from '../error/biz-error';
import {t} from '../i18n/i18n'
import verifyRecordService from './verify-record-service';
import userContext from '../security/user-context';
import domainUtils from '../utils/domain-uitls';

const settingService = {

	async refresh(c) {
		const settingRow = await orm(c).select().from(setting).get();
		if (settingRow) {
			try {
				settingRow.resendTokens = typeof settingRow.resendTokens === 'string' ? JSON.parse(settingRow.resendTokens || '{}') : (settingRow.resendTokens || {});
			} catch (e) {
				settingRow.resendTokens = {};
			}
			c.set?.('setting', settingRow);
			await c.env.kv.put(KvConst.SETTING, JSON.stringify(settingRow));
		}
	},

	async query(c) {

		if (c.get?.('setting')) {
			return c.get('setting');
		}

		let settingData = null;
		try {
			settingData = await c.env.kv.get(KvConst.SETTING, { type: 'json' });
		} catch (kvErr) {
			console.warn('kv.get SETTING warning:', kvErr);
		}

		if (!settingData) {
			try {
				const hasDb = !!(c.env?.db || c.env?.DB);
				if (hasDb) {
					const settingRow = await orm(c).select().from(setting).get();
					if (settingRow) {
						try {
							settingRow.resendTokens = typeof settingRow.resendTokens === 'string' ? JSON.parse(settingRow.resendTokens || '{}') : (settingRow.resendTokens || {});
						} catch (e) {
							settingRow.resendTokens = {};
						}
						settingData = settingRow;
						const kv = c.env?.kv || c.env?.KV;
						if (kv) {
							await kv.put(KvConst.SETTING, JSON.stringify(settingRow));
						}
					}
				}
			} catch (dbErr) {
				console.error('Failed to load setting from DB:', dbErr);
			}
		}

		if (!settingData) {
			console.warn('Setting not found in KV or D1, using safe defaults for email receipt');
			settingData = {
				receive: 0,
				register: 1,
				title: '',
				manyEmail: 0,
				addEmail: 0,
				autoRefresh: 0,
				addEmailVerify: 1,
				registerVerify: 1,
				regVerifyCount: 1,
				addVerifyCount: 1,
				send: 1,
				r2Domain: '',
				regKey: 1,
				tgBotToken: '',
				tgChatId: '',
				tgBotStatus: 1,
				forwardEmail: '',
				forwardStatus: 1,
				ruleEmail: '',
				ruleType: 0,
				noRecipient: 0,
				blackSubject: '',
				blackContent: '',
				blackFrom: '',
				aiCode: 1,
				aiCodeFilter: '',
				syncDelete: 1,
				resendTokens: {},
				emailPrefixFilter: '',
				webhookUrl: '',
				webhookStatus: 1,
				webhookRetry: 0,
				webhookSecret: '',
				minEmailPrefix: 0,
			};
		}

		let domainList = c.env.domain;

		if (typeof domainList === 'string') {
			try {
				domainList = JSON.parse(domainList);
			} catch (error) {
				if (domainList.includes(',')) {
					domainList = domainList.split(',').map(s => s.trim()).filter(Boolean);
				} else if (domainList.trim()) {
					domainList = [domainList.trim()];
				} else {
					domainList = [];
				}
			}
		}

		if (!Array.isArray(domainList) || domainList.length === 0) {
			domainList = ['tv987.shop'];
		}

		domainList = domainList.map(item => item.startsWith('@') ? item : '@' + item);
		settingData.domainList = domainList;

		let projectLink = c.env.project_link;
		if (typeof projectLink === 'string' && projectLink === 'false') {
			projectLink = false;
		} else if (projectLink === false) {
			projectLink = false;
		} else {
			projectLink = true;
		}

		settingData.projectLink = projectLink;

		if (typeof settingData.emailPrefixFilter === 'string') {
			settingData.emailPrefixFilter = settingData.emailPrefixFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
		} else if (Array.isArray(settingData.emailPrefixFilter)) {
			settingData.emailPrefixFilter = settingData.emailPrefixFilter.map(s => String(s).trim().toLowerCase()).filter(Boolean);
		} else {
			settingData.emailPrefixFilter = [];
		}

		let kvTarget = null;
		try {
			kvTarget = await c.env.kv.get('generator_target_user_id');
		} catch (kvErr) {
			console.warn('kv get generator_target_user_id warning:', kvErr);
		}
		settingData.generatorTargetUserId = kvTarget ? Number(kvTarget) : (Number(settingData.generatorTargetUserId) || 0);

		c.set?.('setting', settingData);
		return settingData;
	},

	async get(c, showSiteKey = false) {

		const [settingRow, recordList] = await Promise.all([
			await this.query(c),
			verifyRecordService.selectListByIP(c)
		]);


		if (!showSiteKey) {
			settingRow.siteKey = settingRow.siteKey ? `${settingRow.siteKey.slice(0, 6)}******` : null;
		}

		settingRow.secretKey = settingRow.secretKey ? `${settingRow.secretKey.slice(0, 6)}******` : null;

		Object.keys(settingRow.resendTokens).forEach(key => {
			settingRow.resendTokens[key] = `${settingRow.resendTokens[key].slice(0, 12)}******`;
		});

		settingRow.s3AccessKey = settingRow.s3AccessKey ? `${settingRow.s3AccessKey.slice(0, 12)}******` : null;
		settingRow.s3SecretKey = settingRow.s3SecretKey ? `${settingRow.s3SecretKey.slice(0, 12)}******` : null;
		settingRow.tgBotToken = settingRow.tgBotToken ? `${settingRow.tgBotToken.slice(0, 20)}******` : null;
		settingRow.hasR2 = !!c.env.r2
		settingRow.hasCfEmail = !!c.env.email

		let regVerifyOpen = false
		let addVerifyOpen = false

		recordList.forEach(row => {
			if (row.type === verifyRecordType.REG) {
				regVerifyOpen = row.count >= settingRow.regVerifyCount
			}
			if (row.type === verifyRecordType.ADD) {
				addVerifyOpen = row.count >= settingRow.addVerifyCount
			}
		})

		settingRow.regVerifyOpen = regVerifyOpen
		settingRow.addVerifyOpen = addVerifyOpen

		settingRow.storageType = await r2Service.storageType(c);

		return settingRow;
	},

	async set(c, params) {
		if (params.generatorTargetUserId !== undefined) {
			const targetId = Number(params.generatorTargetUserId);
			await c.env.kv.put('generator_target_user_id', String(params.generatorTargetUserId));
			if (targetId > 0) {
				try {
					await orm(c).update(account).set({ allReceive: 1 }).where(and(eq(account.userId, targetId), eq(account.isDel, isDel.NORMAL))).run();
				} catch (allRecErr) {
					console.warn('Set target user allReceive error:', allRecErr);
				}
			}
			delete params.generatorTargetUserId;
		}

		const settingData = await this.query(c);
		let resendTokens = { ...(settingData.resendTokens || {}), ...params.resendTokens };
		Object.keys(resendTokens).forEach(domain => {
			if (!resendTokens[domain]) delete resendTokens[domain];
		});

		if (Array.isArray(params.emailPrefixFilter)) {
			params.emailPrefixFilter = params.emailPrefixFilter.join(',');
		}

		if (Array.isArray(params.aiCodeFilter)) {
			params.aiCodeFilter = params.aiCodeFilter.join(',');
		}

		if (params.webhookUrl !== undefined) {
			params.webhookUrl = domainUtils.toOssDomain(params.webhookUrl) || '';
		}

		params.resendTokens = JSON.stringify(resendTokens);

		if (Object.keys(params).length > 0) {
			await orm(c).update(setting).set({ ...params }).returning().get();
		}
		await this.refresh(c);
	},

	async deleteBackground(c) {

		const { background } = await this.query(c);
		if (!background) return

		if (background.startsWith('http')) {
			await orm(c).update(setting).set({ background: '' }).run();
			await this.refresh(c)
			return;
		}

		if (background) {
			await r2Service.delete(c,background)
			await orm(c).update(setting).set({ background: '' }).run();
			await this.refresh(c)
		}
	},

	async setBackground(c, params) {

		let { background } = params

		await this.deleteBackground(c);

		if (background && !background.startsWith('http')) {

			const file = fileUtils.base64ToFile(background)

			const arrayBuffer = await file.arrayBuffer();
			background = constant.BACKGROUND_PREFIX + await fileUtils.getBuffHash(arrayBuffer) + fileUtils.getExtFileName(file.name);


			await r2Service.putObj(c, background, arrayBuffer, {
				contentType: file.type,
				cacheControl: `public, max-age=31536000, immutable`,
				contentDisposition: `inline; filename="${file.name}"`
			});

		}

		await orm(c).update(setting).set({ background }).run();
		await this.refresh(c);
		return background;
	},


	async setBlacklist(c, params) {
		const { blackSubject, blackContent, blackFrom  } = params
		await orm(c).update(setting).set({ blackSubject, blackContent, blackFrom }).run();
		await this.refresh(c);
		return this.get(c);
	},

	async websiteConfig(c) {

		const settingRow = await this.get(c, true);
		const token = await userContext.getToken(c);

		return {
			register: settingRow.register,
			title: settingRow.title,
			manyEmail: settingRow.manyEmail,
			addEmail: settingRow.addEmail,
			autoRefresh: settingRow.autoRefresh,
			addEmailVerify: settingRow.addEmailVerify,
			registerVerify: settingRow.registerVerify,
			send: settingRow.send,
			r2Domain: settingRow.r2Domain,
			siteKey: settingRow.siteKey,
			background: settingRow.background,
			loginOpacity: settingRow.loginOpacity,
			domainList: settingRow.loginDomain === 1 && !token ? [] : settingRow.domainList,
			regKey: settingRow.regKey,
			regVerifyOpen: settingRow.regVerifyOpen,
			addVerifyOpen: settingRow.addVerifyOpen,
			noticeTitle: settingRow.noticeTitle,
			noticeContent: settingRow.noticeContent,
			noticeType: settingRow.noticeType,
			noticeDuration: settingRow.noticeDuration,
			noticePosition: settingRow.noticePosition,
			noticeWidth: settingRow.noticeWidth,
			noticeOffset: settingRow.noticeOffset,
			notice: settingRow.notice,
			loginDomain: settingRow.loginDomain,
			linuxdoClientId: settingRow.linuxdoClientId,
			linuxdoSwitch: settingRow.linuxdoSwitch,
			githubClientId: settingRow.githubClientId,
			githubSwitch: settingRow.githubSwitch,
			googleClientId: settingRow.googleClientId,
			googleSwitch: settingRow.googleSwitch,
			minEmailPrefix: settingRow.minEmailPrefix,
			generatorTargetUserId: settingRow.generatorTargetUserId || 0,
			projectLink: settingRow.projectLink
		};
	},

};

export default settingService;
