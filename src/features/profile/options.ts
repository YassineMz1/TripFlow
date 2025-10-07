export const BUDGET_STEPS = [1, 2, 3, 4, 5] as const; // 1=Budget ... 5=Luxury
export const BUDGET_LABELS: Record<number, string> = {
  1: "Budget",
  2: "Economy",
  3: "Standard",
  4: "Premium",
  5: "Luxury",
};

export const ACCOMMODATION_OPTIONS = [
  { value: "Hotel", label: "Hotel", emoji: "🏨" },
  { value: "Hostel", label: "Hostel", emoji: "🏠" },
  { value: "Airbnb", label: "Airbnb", emoji: "🏡" },
  { value: "Resort", label: "Resort", emoji: "🏝️" },
  { value: "Guesthouse", label: "Guesthouse", emoji: "🏘️" },
] as const;

export const TRANSPORT_OPTIONS = [
  { value: "Public Transit", label: "Public Transit", emoji: "🚌" },
  { value: "Car", label: "Car", emoji: "🚗" },
  { value: "Walking", label: "Walking", emoji: "🚶" },
  { value: "Bicycle", label: "Bicycle", emoji: "🚴" },
  { value: "Train", label: "Train", emoji: "🚆" },
  { value: "Flight", label: "Flight", emoji: "✈️" },
] as const;

export const INTEREST_OPTIONS = [
  { value: "Cultural", label: "Cultural", emoji: "🏛️" },
  { value: "Historical", label: "Historical", emoji: "📚" },
  { value: "Nature", label: "Nature", emoji: "🌲" },
  { value: "Food", label: "Food", emoji: "🍽️" },
  { value: "Shopping", label: "Shopping", emoji: "🛍️" },
  { value: "Adventure", label: "Adventure", emoji: "🎢" },
  { value: "Relaxation", label: "Relaxation", emoji: "🧘" },
  { value: "Photography", label: "Photography", emoji: "📸" },
  { value: "Nightlife", label: "Nightlife", emoji: "🌙" },
  { value: "Art", label: "Art", emoji: "🎨" },
] as const;

export const FOOD_OPTIONS = [
  { value: "Local Cuisine", label: "Local Cuisine", emoji: "🍲" },
  { value: "Asian", label: "Asian", emoji: "🍣" },
  { value: "European", label: "European", emoji: "🥐" },
  { value: "American", label: "American", emoji: "🍔" },
  { value: "Vegetarian", label: "Vegetarian", emoji: "🥗" },
  { value: "Vegan", label: "Vegan", emoji: "🌿" },
  { value: "Gluten-Free", label: "Gluten-Free", emoji: "🌾" },
  { value: "Halal", label: "Halal", emoji: "🥙" },
] as const;
