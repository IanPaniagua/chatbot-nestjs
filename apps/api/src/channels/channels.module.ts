import { Module } from '@nestjs/common';
import { TwilioChannelService } from './twilio-channel.service';

@Module({
  providers: [TwilioChannelService],
  exports: [TwilioChannelService],
})
export class ChannelsModule {}
