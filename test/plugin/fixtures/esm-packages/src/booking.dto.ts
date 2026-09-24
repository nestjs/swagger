import { Status } from 'plain-pkg/out/main.js';
import { Cabin, Status as MtsStatus } from 'mts-pkg';
import { Status as IndexStatus } from 'index-pkg';

export class BookingDto {
  status: Status;
  mtsStatus: MtsStatus;
  cabins: Cabin[];
  indexStatus: IndexStatus;
}
