import { Controller, Get, Param } from '@nestjs/common';
import { ApiCreatedResponse, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TranslateResultDto } from 'src/dto/translate.dto';
import { Test } from 'src/schemas/test.schema';
import { TestService } from 'src/services/test.service';
import { TranslateService } from 'src/services/translate.service';

@Controller("/test")
@ApiTags("Test")
export class TestController {
  constructor(private readonly testService: TestService, private readonly translateService: TranslateService) {}

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

  @Get("/translate/:text")
  @ApiParam({ name: "text", type: String, required: true})
  @ApiResponse({ status: 200, description: "Detects language of text", type: String})
  detectLanguage(@Param() params: {
    text: string;
  }): Promise<TranslateResultDto> {
    return this.translateService.translateTextToAllLanguages(params.text);
  }
}
