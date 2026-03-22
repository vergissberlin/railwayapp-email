import { EmailService } from "../services/email-service"

let emailService: EmailService
export function getEmailService() {
    if (!emailService) {
        emailService = new EmailService()
    }
    return emailService
}
