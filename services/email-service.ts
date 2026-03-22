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
        userId: number
        name: string
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
export class EmailService {
    private mailTransport!: Transporter<SMTPTransport.SentMessageInfo>
    constructor() {
        this.initMailConfig()
    }

    sendEmails(sendMaileOption: ISendEmailOption) {
        let htmlContent = []
        let { IToList, template } = sendMaileOption
        for (let to of IToList) {
            let mailOptions = {
                from: process.env.EMAIL_CLIENT_FROM,
                to: to.email,
                subject: template.value.emailSubject[to.locale || "en"],
                html: this.getEmailContent({
                    templateName: template.value.templateName,
                    locale: to.locale,
                    context: to.context
                })
            }
            console.log({ mailOptions })

            try {
                this.mailTransport.sendMail(mailOptions, (err: any, info: any) => {
                    if (err) {
                        console.log("some error here :", err)
                    } else {
                        console.log("Email sent: " + info.response)
                    }
                })
            } catch (error) {
                console.log("error here ", error)
            }
            htmlContent.push(mailOptions.html)
        }
        return { htmlContent }
    }

    getEmailContent(emailOptions: {
        templateName: string
        locale: LocaleEnum | undefined
        context: Object
    }) {
        const { templateName, locale = LocaleEnum.EN_US, context } = emailOptions
        const emailTemplateSource = fs.readFileSync(
            path.resolve(`email-templates/${locale}/${templateName}.hbs`),
            "utf8"
        )
        const template = handlebars.compile(emailTemplateSource)
        const htmlToSend = template(context)
        return htmlToSend
    }

    initMailConfig() {
        const emailConfig = {
            service: process.env.EMAIL_SERVICE_PROVIDER,
            host: process.env.EMAIL_HOST,
            auth: {
                user: process.env.EMAIL_CLIENT_USER, // generated gmail user
                pass: process.env.EMAIL_CLIENT_PASSWORD // generated gmail account password
            }
        }
        this.mailTransport = nodemailer.createTransport(emailConfig)
    }
}
