import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from 'src/auth/decorators/role.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/users.entity';
import { ApplicationsService } from './applications.service';
import { OrganizationRoleGuard } from 'src/organization/guards/organization-role.guard';
import { OrganizationRole } from 'src/organization/entities/organization-members.entity';
import { OrgRole } from 'src/organization/decorators/organization-role.decorator';
import { RecruiterUpdateApplicationDto } from './dto/recruiter-update-application.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('/jobs/:jobId/apply')
export class ApplicationsController {
  constructor(private readonly applicationService: ApplicationsService) {}
  @Post()
  @UseInterceptors(FileInterceptor('resume'))
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  createApplication(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 5,
            message: 'File is too large. Maximum allowed size is 5MB.',
          }),
          new FileTypeValidator({
            fileType: /(pdf|doc|docx)$/i, // i = case insensitive (pdf, Pdf, PDF all allowed)
            errorMessage:
              'Invalid file format. Only PDF, DOC, and DOCX files are allowed.',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.applicationService.create(jobId, req.user.id, file);
  }
}

@Controller('/applications/me')
export class ProfileApplicationController {
  constructor(private readonly applicationService: ApplicationsService) {}

  @Get()
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  getAllMyApplications(@Req() req) {
    return this.applicationService.findAllApplicationsByUserId(req.user.id);
  }

  @Get(':appId')
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  getMyApplicationById(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Req() req,
  ) {
    return this.applicationService.getMyApplicationById(appId, req.user.id);
  }

  @Patch(':appId')
  @UseInterceptors(FileInterceptor('resume'))
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  updateMyApplicationById(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 5,
            message: 'File is too large. Maximum allowed size is 5MB.',
          }),
          new FileTypeValidator({
            fileType: /(pdf|doc|docx)$/i, // i = case insensitive (pdf, Pdf, PDF all allowed)
            errorMessage:
              'Invalid file format. Only PDF, DOC, and DOCX files are allowed.',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.applicationService.updateMyApplicationById(
      appId,
      req.user.id,
      file,
    );
  }

  @Delete(':appId')
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  deleteMyApplicationById(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Req() req,
  ) {
    return this.applicationService.deleteApplication(appId, req.user.id);
  }
}

@Controller('/organization/:orgId/jobs/:jobId/applications')
export class OrganizationApplicationsController {
  constructor(private readonly applicationService: ApplicationsService) {}
  @Get()
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  getApplicantsByJobId(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Req() req,
  ) {
    return this.applicationService.findApplicationsByOrgIdAndJobId(
      orgId,
      jobId,
      req.user.id,
    );
  }

  @Patch(':appId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  updateApplicationStatus(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,

    @Req() req,
    @Body() updateApplicationDto: RecruiterUpdateApplicationDto,
  ) {
    return this.applicationService.updateApplicationStatus(
      appId,
      orgId,
      jobId,
      req.user.id,
      updateApplicationDto,
    );
  }
}
