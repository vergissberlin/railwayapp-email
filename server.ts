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

app.post("/email/registration", async (req, res) => {
    const apiKey = req.header("x-api-key")
    if (!process.env.EMAIL_API_KEY || apiKey !== process.env.EMAIL_API_KEY) {
        res.status(401).json({ message: "Unauthorized" })
        return
    }

    if (missingEnvVars.length > 0) {
        res.status(500).json({
            message: "Email service is not configured",
            missingEnvVars
        })
        return
    }

    const { locale = "EN_US", to, name = "there", userId, verificationUrl } = req.body ?? {}
    if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+$/.test(to)) {
        res.status(400).json({ message: "Field \"to\" must be a valid email address" })
        return
    }
    const selectedLocale = LocaleEnum[locale as keyof typeof LocaleEnum]
    if (!selectedLocale) {
        res.status(400).json({
            message: "Invalid locale, please pick from: ['ZH_TW', 'EN_US']"
        })
        return
    }

    const baseUrl =
        process.env.VERIFICATION_BASE_URL || "http://localhost:8080/user/verification/"
    const sendMailOption: SendMailOption<IEmailTemplateContext["VERIFICATION"]> = {
        IToList: [
            {
                email: to,
                locale: selectedLocale,
                context: {
                    name: String(name),
                    userId: userId ?? "",
                    verificationUrl:
                        typeof verificationUrl === "string" && verificationUrl
                            ? verificationUrl
                            : `${baseUrl}${userId ?? ""}`
                }
            }
        ],
        template: EmailTemplate.VERIFICATION
    }

    try {
        const { messageIds } = await getEmailService().sendEmails(sendMailOption)
        res.status(200).json({ message: "email/registration done", messageIds })
    } catch (error) {
        console.error("Failed to send registration email:", error)
        res.status(502).json({
            message: error instanceof Error ? error.message : String(error)
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

if (!process.env.EMAIL_API_KEY) {
    console.error(
        "EMAIL_API_KEY is not set: POST /email/registration will reject all requests with 401"
    )
}

app.listen(port, () => {
    console.log("server started on port", port)
})
