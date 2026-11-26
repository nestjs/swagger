export class BillingDto {
  plan: string;
}

class ListedDto {
  billing: BillingDto;
}

class RenamedDto {
  billing: BillingDto;
}

class DefaultDto {
  billing: BillingDto;
}

class InternalDto {
  billing: BillingDto;
}

export { ListedDto, RenamedDto as PublicDto };
export default DefaultDto;
