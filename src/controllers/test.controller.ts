import { Controller, Get } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Test } from 'src/schemas/test.schema';
import { TestService } from 'src/services/test.service';

@Controller("/test")
@ApiTags("Test")
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  @ApiResponse({ status: 200, description: "Returns string", type: String})
  getHello(): Promise<string> {
    return this.testService.getHello();
  }

  @Get("/create")
  @ApiCreatedResponse({ description: "Creates a random test", type: Test})
  createRandomTest(): Promise<Test> {
    return this.testService.createRandomTest();
  }
}
