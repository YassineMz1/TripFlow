export type Card = {
  title: string;
  subtitle: string;
  pills: string[];
  icon: string;
  gradient: string;
};

export const CARDS: Card[] = [
  {
    title: "Start Your Trip with\nTripFlow!",
    subtitle: "AI-powered travel planning for your special journey",
    pills: ["Travel Start", "AI Companion", "Global Service"],
    icon: "✈️",
    gradient: "from-[#3A67FF] to-[#2CC7A5]",
  },
  {
    title: "Plan Together in Real-time",
    subtitle: "Edit schedules and share ideas together like Google Docs",
    pills: ["Simultaneous Editing", "Invite", "Role Management"],
    icon: "🧑‍🤝‍🧑",
    gradient: "from-[#3F7BFA] to-[#72D5FF]",
  },
  {
    title: "Timeline & Map View",
    subtitle: "Check organized schedules and map-based routes at a glance",
    pills: ["Timeline View", "Map Routes", "Easy Management"],
    icon: "🗺️",
    gradient: "from-[#2FB46B] to-[#77DD77]",
  },
  {
    title: "Multi-Agent System",
    subtitle: "5 specialized agents working together for optimal travel plans",
    pills: ["Domain Expert AI", "Real-time Collaboration"],
    icon: "🤖",
    gradient: "from-[#7C4DFF] to-[#9B7BFF]",
  },
  {
    title: "AI Travel Assistant",
    subtitle: "5-minute itinerary generation and 24/7 AI chatbot consultation",
    pills: ["AI Draft Generation", "24/7 Chatbot", "Custom Recommendations"],
    icon: "🧠",
    gradient: "from-[#E86BB0] to-[#7BC9FF]",
  },
];
