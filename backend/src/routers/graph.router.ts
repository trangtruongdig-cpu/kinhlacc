import { Controller, Get, Param, Query } from '@nestjs/common';
import { GraphService } from '../controllers/graph.controller';

@Controller('graph')
export class GraphRouter {
  constructor(private readonly service: GraphService) {}

  /** Vùng lân cận 1-hop của một node bất kỳ: /graph/node?type=vi-thuoc&id=18 */
  @Get('node')
  node(@Query('type') type: string, @Query('id') id: string) {
    return this.service.neighborhood(type, Number(id));
  }

  /** Tiện ích: lấy đồ thị quanh một bài thuốc. */
  @Get('bai-thuoc/:id')
  baiThuoc(@Param('id') id: string) {
    return this.service.neighborhood('bai-thuoc', Number(id));
  }
}
