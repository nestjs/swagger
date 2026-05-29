import { UUID } from 'crypto';
import { ItemStatus, ItemStatus as StatusAlias } from '@repro/shared/messages';
import * as SharedMessages from '@repro/shared/messages';

class LocalStatus {}

export class ItemDto {
  status!: ItemStatus;
  aliasedStatus!: StatusAlias;
  statusList!: ItemStatus[];
  nullableStatus!: ItemStatus | null;
  namespacedStatus!: SharedMessages.ItemStatus;
  uuid!: UUID;
  localStatus!: LocalStatus;
}
