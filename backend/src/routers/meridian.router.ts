import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MeridiansService, AnalyzeInputDto, AnalyzeOutputDto } from '../controllers/meridian.controller';

@Controller('meridian')
export class MeridiansRouter {
  constructor(private readonly meridiansService: MeridiansService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() body: AnalyzeInputDto): Promise<AnalyzeOutputDto> {
    return this.meridiansService.analyze(body);
  }
}
