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

export async function email(message, env, ctx) {

	try {

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
		} = await settingService.query({ env });

		if (receive === settingConst.receive.CLOSE) {
			message.setReject('Service suspended');
			return;
		}

		const reader = message.raw.getReader();
		let content = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			content += new TextDecoder().decode(value);
		}

		const email = await PostalMime.parse(content);

		const blockFlag = checkBlock(blackSubject, blackContent, blackFrom, email);

		if (blockFlag) {
			message.setReject('Message rejected');
			return;
		}

		const toAddress = (message.to || '').trim();
		let account = await accountService.selectByEmailIncludeDel({ env: env }, toAddress);

		if (!account) {
			const baseEmail = emailUtils.getBaseEmail(toAddress);
			if (baseEmail && baseEmail.toLowerCase() !== toAddress.toLowerCase()) {
				account = await accountService.selectByEmailIncludeDel({ env: env }, baseEmail);
			}
		}

		if (!account && noRecipient === settingConst.noRecipient.CLOSE) {
			message.setReject('Recipient not found');
			return;
		}

		let userRow = {};

		if (account) {
			userRow = (await userService.selectByIdIncludeDel({ env: env }, account.userId)) || {};
		}

		// Check if recipient belongs to super admin
		const uEmail = (userRow.email || '').toLowerCase();
		const adminConfig = (env.admin || '').toLowerCase().trim();
		const isAdmin = (
			userRow.userId === 1 ||
			userRow.type === 0 ||
			(adminConfig && (uEmail === adminConfig || uEmail.startsWith(adminConfig + '@') || emailUtils.getName(uEmail) === adminConfig))
		);

		if (account && !isAdmin) {
			try {
				let roleRow = await roleService.selectByUserId({ env: env }, account.userId);
				let banEmail = roleRow?.banEmail;
				let availDomain = roleRow?.availDomain;

				if (availDomain && !roleService.hasAvailDomainPerm(availDomain, toAddress)) {
					message.setReject('The recipient is not authorized to use this domain.');
					return;
				}

				if (banEmail && roleService.isBanEmail(banEmail, email.from?.address || message.from || '')) {
					message.setReject('The recipient is disabled from receiving emails.');
					return;
				}
			} catch (roleErr) {
				console.error('Role check failed, continuing email receipt:', roleErr);
			}
		}

		if (!email.to || !Array.isArray(email.to) || email.to.length === 0) {
			email.to = [{ address: toAddress, name: emailUtils.getName(toAddress) }];
		}

		const toName = email.to.find(item => (item.address || '').toLowerCase() === toAddress.toLowerCase())?.name || '';
		let code = '';
		try {
			code = await aiService.extractCode({ env }, email, { aiCode, aiCodeFilter });
		} catch (aiErr) {
			console.error('AI code extraction error:', aiErr);
		}

		const fromAddress = email.from?.address || message.from || '';
		const fromName = email.from?.name || (fromAddress ? emailUtils.getName(fromAddress) : '');

		const params = {
			toEmail: toAddress,
			toName: toName || '',
			sendEmail: fromAddress,
			name: fromName || '',
			subject: email.subject || '',
			code: code || '',
			content: email.html || '',
			text: email.text || '',
			cc: email.cc ? JSON.stringify(email.cc) : '[]',
			bcc: email.bcc ? JSON.stringify(email.bcc) : '[]',
			recipient: JSON.stringify(email.to),
			inReplyTo: email.inReplyTo || '',
			relation: email.references || '',
			messageId: email.messageId || '',
			userId: account ? account.userId : 0,
			accountId: account ? account.accountId : 0,
			isDel: isDel.DELETE,
			status: emailConst.status.SAVING
		};

		const attachments = [];
		const cidAttachments = [];

		for (let item of (email.attachments || [])) {
			let attachment = { ...item };
			attachment.key = constant.ATTACHMENT_PREFIX + await fileUtils.getBuffHash(attachment.content) + fileUtils.getExtFileName(item.filename || '');
			attachment.size = item.content?.length ?? item.content?.byteLength ?? 0;
			attachments.push(attachment);
			if (attachment.contentId) {
				cidAttachments.push(attachment);
			}
		}

		let emailRow = await emailService.receive({ env }, params, cidAttachments, r2Domain);

		attachments.forEach(attachment => {
			attachment.emailId = emailRow.emailId;
			attachment.userId = emailRow.userId;
			attachment.accountId = emailRow.accountId;
		});

		try {
			if (attachments.length > 0) {
				await attService.addAtt({ env }, attachments);
			}
		} catch (e) {
			console.error('附件添加异常:', e);
		}

		emailRow = await emailService.completeReceive({ env }, account ? emailConst.status.RECEIVE : emailConst.status.NOONE, emailRow.emailId);

		if (ruleType === settingConst.ruleType.RULE && ruleEmail) {
			const emails = ruleEmail.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
			if (!emails.includes(toAddress.toLowerCase())) {
				return;
			}
		}

		// 转发到TG
		if (tgBotStatus === settingConst.tgBotStatus.OPEN && tgChatId) {
			try {
				await telegramService.sendEmailToBot({ env }, emailRow);
			} catch (tgErr) {
				console.error('转发到TG失败:', tgErr);
			}
		}

		// 转发到其他邮箱
		if (forwardStatus === settingConst.forwardStatus.OPEN && forwardEmail) {
			const emails = forwardEmail.split(',').map(s => s.trim()).filter(Boolean);
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
				await webhookService.sendEmail({ env }, emailRow, webhookUrl, webhookRetry, webhookSecret);
			} catch (whErr) {
				console.error('转发到Webhook失败:', whErr);
			}
		}

	} catch (e) {
		console.error('邮件接收异常: ', e);
		throw e;
	}
}

function checkBlock(blackSubjectStr, blackContentStr, blackFromStr, email) {

	const blackFromList = blackFromStr ? blackFromStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
	const blackContentList = blackContentStr ? blackContentStr.split(',').map(s => s.trim()).filter(Boolean) : [];
	const blackSubjectList = blackSubjectStr ? blackSubjectStr.split(',').map(s => s.trim()).filter(Boolean) : [];

	const fromAddress = (email.from?.address || '').toLowerCase();
	const fromDomain = emailUtils.getDomain(fromAddress).toLowerCase();

	for (const blackSubject of blackSubjectList) {
		if (blackSubject && email.subject?.includes(blackSubject)) {
			return true;
		}
	}

	for (const blackContent of blackContentList) {
		if (blackContent && (email.html?.includes(blackContent) || email.text?.includes(blackContent))) {
			return true;
		}
	}

	for (const blackFrom of blackFromList) {
		if (blackFrom && (fromAddress === blackFrom || fromDomain === blackFrom)) {
			return true;
		}
	}

	return false;
}
