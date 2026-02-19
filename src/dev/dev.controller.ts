import { Controller, Get } from '@nestjs/common';
import { DevService } from './dev.service';

@Controller('dev')
export class DevController {
      constructor(private readonly devService: DevService) { }

      @Get('seed')
      async seed() {
            return this.devService.seed();
      }
}
