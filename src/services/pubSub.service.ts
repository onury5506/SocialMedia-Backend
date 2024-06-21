import { Injectable } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PubSubService {
  private client: PubSub
  constructor(
    private readonly configService: ConfigService,
  ) {
    this.client = new PubSub({
      keyFilename: this.configService.get<string>("GOOGLE_KEY_FILE_PATH")
    })
  }

  subscribe<T>(topicName: string, subscriptionName: string, callback: (message: T) => void) {
    const subscription = this.client.topic(topicName).subscription(subscriptionName)
    subscription.on('message', async (message) => {
      const data = JSON.parse(message.data.toString())
      callback(data)
      message.ack()
    })
  }
}
