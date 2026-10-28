import nodemailer, { Transporter } from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import handlebars from "handlebars"
import path from "path"
import fs from "fs"
import { EmailTemplate } from "../utils/EmailTemplate"
import dotenv from "dotenv"
dotenv.config()

export interface ISendEmailOption {
    IToList: Array<{
        email: string
        context: Object
        locale?: LocaleEnum
    }>
    template: EmailTemplate
}

export enum LocaleEnum {
    EN_US = "en",
    ZH_TW = "tw"
}

export interface IEmailTemplateContext {
    REGISTRATION: {
        name: string
        token: string
    }
    VERIFICATION: {
        userId: number | string
        name: string
        verificationUrl: string
    }
    INVITATION: {
        roomURL: string
    }
}
interface IToList<T> {
    email: string
    context: T
    locale: LocaleEnum
}
export interface SendMailOption<T> {
    IToList: IToList<T>[]
    template: EmailTemplate
}
// Templates live in <project root>/templates/<locale>/<name>.hbs. The compiled
// code runs from dist/services, so resolve relative to the working directory
// first and fall back to paths relative to this file.
const TEMPLATE_DIRS = [
    process.env.EMAIL_TEMPLATE_DIR,
    path.resolve(process.cwd(), "templates"),
    path.resolve(__dirname, "..", "templates"),
    path.resolve(__dirname, "..", "..", "templates")
].filter((dir): dir is string => Boolean(dir))

export function resolveTemplatePath(templateName: string, locale: LocaleEnum): string {
    const locales = locale === LocaleEnum.EN_US ? [locale] : [locale, LocaleEnum.EN_US]
    for (const dir of TEMPLATE_DIRS) {
        for (const loc of locales) {
            const candidate = path.join(dir, loc, `${templateName}.hbs`)
            if (fs.existsSync(candidate)) return candidate
        }
    }
    throw new Error(`Email template "${templateName}" not found for locale "${locale}"`)
}

export class EmailService {
    private mailTransport!: Transporter<SMTPTransport.SentMessageInfo>
    constructor() {
        this.initMailConfig()
    }

    async sendEmails(sendMaileOption: ISendEmailOption) {
        const htmlContent: string[] = []
        const messageIds: string[] = []
        const { IToList, template } = sendMaileOption
        for (const to of IToList) {
            const locale = to.locale || LocaleEnum.EN_US
            const mailOptions = {
                from: process.env.EMAIL_CLIENT_FROM,
                to: to.email,
                subject: template.value.emailSubject[locale],
                html: this.getEmailContent({
                    templateName: template.value.templateName,
                    locale,
                    context: to.context
                })
            }
            const info = await this.mailTransport.sendMail(mailOptions)
            console.log("Email sent:", info.messageId, info.response)
            messageIds.push(info.messageId)
            htmlContent.push(mailOptions.html)
        }
        return { htmlContent, messageIds }
    }

    getEmailContent(emailOptions: {
        templateName: string
        locale: LocaleEnum | undefined
        context: Object
    }) {
        const { templateName, locale = LocaleEnum.EN_US, context } = emailOptions
        const emailTemplateSource = fs.readFileSync(
            resolveTemplatePath(templateName, locale),
            "utf8"
        )
        const template = handlebars.compile(emailTemplateSource)
        const htmlToSend = template(context)
        return htmlToSend
    }

    initMailConfig() {
        const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined
        const emailConfig = {
            service: process.env.EMAIL_SERVICE_PROVIDER,
            host: process.env.EMAIL_HOST,
            port,
            secure: process.env.EMAIL_SECURE
                ? process.env.EMAIL_SECURE === "true"
                : port === 465,
            auth: {
                user: process.env.EMAIL_CLIENT_USER, // generated gmail user
                pass: process.env.EMAIL_CLIENT_PASSWORD // generated gmail account password
            }
        }
        this.mailTransport = nodemailer.createTransport(emailConfig)
    }
}
