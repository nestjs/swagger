import { Account as AccountEntity } from './account.entity.js';

declare module './account.entity.js' {
  interface Account {
    label: string;
  }
}

export class AccountListDto {
  items: AccountEntity[];
}
