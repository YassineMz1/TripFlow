export class CreateBudgetDto {
  totalBudget: number;
  travelDays: number;
  destinationType: 'beach' | 'adventure' | 'culture' | 'city' | 'nature';
  currency?: string; // optional
}
