import { Module } from '@nestjs/common';
import { SystemErrorListener } from './listeners/system-error.listener';
import { DiscordService } from './services/discord.service';

@Module({
    providers: [SystemErrorListener, DiscordService]
})
export class NotificationsModule { }
