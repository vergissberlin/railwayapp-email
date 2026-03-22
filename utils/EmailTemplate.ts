import { LocaleEnum } from "../services/email-service"

export class EmailTemplate {
    static readonly REGISTRATION = new EmailTemplate("REGISTRATION", {
        templateName: "regisration",
        emailSubject: {
            en: "Registration",
            tw: "註冊"
        }
    });
    static readonly VERIFICATION = new EmailTemplate("VERIFICATION", {
        templateName: "verification",
        emailSubject: {
            en: "Verification",
            tw: "確認"
        }
    });
    static readonly INVITATION = new EmailTemplate("INVITATION", {
        templateName: "INVITATION",
        emailSubject: {
            en: "Invitation From Code-talker",
            tw: "邀請"
        }
    });
    // private to disallow creating other instances of this type
    private constructor(
        private readonly key: string,
        public readonly value: {
            templateName: string
            emailSubject: {
                [key in LocaleEnum]: string
            }
        }
    ) { }

    toString() {
        return this.key
    }
}
