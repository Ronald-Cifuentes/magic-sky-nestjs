import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsResolver } from './cms.resolver';
import { CmsPageDefinitionService } from './cms-page-definition.service';
import { CmsPageDefinitionResolver } from './cms-page-definition.resolver';
@Module({
  providers: [CmsService, CmsResolver, CmsPageDefinitionService, CmsPageDefinitionResolver],
  exports: [CmsService, CmsPageDefinitionService],
})
export class CmsModule {}
