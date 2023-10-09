import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  heathCheck(): string {
    return 'Server up and running!';
  }
}
