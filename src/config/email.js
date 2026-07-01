const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const envoyerEmailResetPassword = async (email, nom, lien) => {
    try {
        await resend.emails.send({
            from: 'AgroTrace <onboarding@resend.dev>',
            to: email,
            subject: 'Réinitialisation de votre mot de passe AgroTrace',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #1B6B3A;">AgroTrace</h2>
                    <p>Bonjour ${nom},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe sur AgroTrace.</p>
                    <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe (ce lien expire dans 1 heure) :</p>
                    <a href="${lien}" style="display: inline-block; background-color: #1B6B3A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                        Réinitialiser mon mot de passe
                    </a>
                    <p style="color: #888; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                    <p style="color: #888; font-size: 13px;">AgroTrace — Système de gestion et de traçabilité agroalimentaire</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Erreur envoi email:', error);
        return false;
    }
};

module.exports = { envoyerEmailResetPassword };