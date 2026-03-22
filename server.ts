import express from "express"
import { getEmailService } from "./utils/email"
import { EmailTemplate } from "./utils/EmailTemplate"
import {
    IEmailTemplateContext,
    LocaleEnum,
    SendMailOption
} from "./services/email-service"

const app = express()
app.use(express.json())

const requiredEnvVars = [
    "EMAIL_SERVICE_PROVIDER",
    "EMAIL_HOST",
    "EMAIL_CLIENT_USER",
    "EMAIL_CLIENT_PASSWORD",
    "EMAIL_CLIENT_FROM"
]

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name])

app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" })
})

app.post("/email/registration", (req, res) => {
    if (missingEnvVars.length > 0) {
        res.status(500).json({
            message: "Email service is not configured",
            missingEnvVars
        })
        return
    }

    let emailService = getEmailService()

    let { locale, to } = req.body
    console.log({ locale, to })
    let localeKey = locale as keyof typeof LocaleEnum
    let selectedLocale: LocaleEnum = LocaleEnum[localeKey]
    if (!selectedLocale) {
        res.json({
            message: "Invalid locale, please pick from :['ZH_TW', 'EN_US']"
        })
        return
    }

    try {
        let sendMaileOption: SendMailOption<
            IEmailTemplateContext["VERIFICATION"]
        > = {
            IToList: [
                {
                    email: to,
                    locale: selectedLocale,
                    context: { name: "Dickson", userId: 9999 }
                }
            ],
            template: EmailTemplate.VERIFICATION
        }

        emailService.sendEmails(sendMaileOption)
        res.send("email/registration done ")
    } catch (error) {
        res.json({
            message: error
        })
    }
})

app.use(express.static("public"))

const port = Number(process.env.PORT) || 8080

if (missingEnvVars.length > 0) {
    console.error(
        "Missing required environment variables:",
        missingEnvVars.join(", ")
    )
}

app.listen(port, () => {
    console.log("server started on port", port)
})
