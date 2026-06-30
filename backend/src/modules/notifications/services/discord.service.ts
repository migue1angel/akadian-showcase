import { Injectable, Logger } from "@nestjs/common";
import { envs } from "src/config/configuration";
import { SystemErrorEvent } from "src/shared/system-error.event";

@Injectable()
export class DiscordService {
    constructor() { }

    private readonly logger = new Logger(DiscordService.name);

    private readonly webhookUrl = envs.discordWebhookUrl;

    async sendErrorAlert(payload: SystemErrorEvent): Promise<void> {
        if (!this.webhookUrl) return;

        const embed = {
            title: `❌ Internal Server Error (500)`,
            color: 0xff0000, // Rojo
            description: `**Message:** ${payload.message}`,
            fields: [
                { name: 'Code', value: payload.contextData?.code || 'UNKNOWN', inline: true },
                { name: 'Method', value: payload.contextData?.method || 'N/A', inline: true },
                { name: 'Path', value: `\`${payload.contextData?.path}\``, inline: false },
                { name: 'Correlation ID', value: payload.contextData?.correlationId || 'N/A', inline: false },
            ],
            timestamp: payload.timestamp,
            footer: { text: 'Akadian Monitoring System' }
        };

        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] }),
            });
        } catch (error) {
            this.logger.error('Error enviando a Discord', error);
        }
    }
}