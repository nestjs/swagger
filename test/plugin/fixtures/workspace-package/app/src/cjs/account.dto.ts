import { Account, PublicProfile, Status } from '@fixture/shared/messages';

export class AccountDto {
  profile: PublicProfile;
  members: Account[];
  status: Status.ACTIVE;
}
