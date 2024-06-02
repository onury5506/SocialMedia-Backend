import { Controller, Get } from '@nestjs/common';
import { Test } from 'src/schemas/test.schema';
import { TestService } from 'src/services/test.service';

@Controller("/test")
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  getHello(): Promise<string> {
    return this.testService.getHello();
  }

  @Get("/create")
  createRandomTest(): Promise<Test> {
    return this.testService.createRandomTest();
  }
}
