import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SystemErrorEvent } from "src/shared/system-error.event";
import { SYSTEM_ERROR_EVENT } from "src/shared/consts/events";
import { DiscordService } from "../services/discord.service";

@Injectable()
export class SystemErrorListener {
    constructor(private readonly discordService: DiscordService) { }
    private readonly logger = new Logger(SystemErrorListener.name);

    @OnEvent(SYSTEM_ERROR_EVENT, { async: true })
    async handleSystemError(event: SystemErrorEvent) {
        this.logger.error(`[${event.contextData.code}] ${event.message}`)
        await this.discordService.sendErrorAlert(event)
    }
}
