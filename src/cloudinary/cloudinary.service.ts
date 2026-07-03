import { BadRequestException, Injectable } from '@nestjs/common';
import * as streamifier from 'streamifier';
import 'multer';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'rozgaar/resumes',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(
              new Error('Cloudinary upload returned empty response'),
            );
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(
        publicId,
        {
          resource_type: 'image', // set type to image, works for pdf deletion
          invalidate: true, // clear cache of CDNs for this file immediately
        },
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException(
                `Cloudinary deletion failed: ${error.message}`,
              ),
            );
          }
          resolve(result); // cloudinary returns { result: 'ok' } if successful, or { result: 'not found' } if file with publicId doesn't exist
        },
      );
    });
  }
}
