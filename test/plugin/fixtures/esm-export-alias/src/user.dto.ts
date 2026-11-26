class User {
  id: string;
  passwordHash: string;
}

class PublicUser {
  id: string;
}

class Pub {
  id: string;
}

enum AccountState {
  ACTIVE = 'active',
  CLOSED = 'closed'
}

namespace Internal {
  export class AuditDto {
    id: string;
  }
}

export { PublicUser as User, Pub as Shown, AccountState as State };
export { Internal as Audit };

export default class ProfileDto {
  id: string;
}

export class UserListDto {
  items: PublicUser[];
  owner: User;
  shown: Pub;
  state: AccountState;
  closed: AccountState.CLOSED;
  audit: Internal.AuditDto;
  profile: ProfileDto;
}
