// Field specs driving the Tool and Device forms/cards.
const rating = (key, label) => ({ key, label, kind: "rating" });

export const TOOL_FIELDS = [
  { key: "name", label: "Name" },
  { key: "provider", label: "Provider" },
  { key: "category", label: "Category", placeholder: "Chat AI, coding agent, image, IDE..." },
  { key: "cost", label: "Cost", placeholder: "Free, $20/mo..." },
  { key: "speed", label: "Speed", kind: "select", options: ["slow", "medium", "fast"] },
  { key: "privacy", label: "Privacy", kind: "select", options: ["low", "medium", "high"] },
  { key: "deployment", label: "Local / Cloud", kind: "select", options: ["local", "cloud", "hybrid"] },
  { key: "last_tested", label: "Last Tested", kind: "date" },
  rating("coding_ability", "Coding (1-5)"),
  rating("reasoning_ability", "Reasoning (1-5)"),
  rating("automation_ability", "Automation (1-5)"),
  rating("visual_ability", "Visual (1-5)"),
  rating("user_rating", "My Rating (1-5)"),
  { key: "strengths", label: "Strengths", kind: "text" },
  { key: "weaknesses", label: "Weaknesses", kind: "text" },
  { key: "best_uses", label: "Best Uses", kind: "text" },
  { key: "poor_uses", label: "Poor Uses", kind: "text" },
  { key: "notes", label: "Notes", kind: "text" },
];

export const DEVICE_FIELDS = [
  { key: "name", label: "Name" },
  { key: "device_type", label: "Device Type", placeholder: "Desktop, laptop, phone..." },
  { key: "operating_system", label: "Operating System" },
  { key: "ram", label: "RAM" },
  { key: "storage", label: "Storage" },
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU (if known)" },
  { key: "development_tools", label: "Development Tools", kind: "text" },
  { key: "local_ai_capability", label: "Local AI Capability", kind: "text" },
  { key: "mobile_capability", label: "Mobile Capability", kind: "text" },
  { key: "voice_capability", label: "Voice Capability", kind: "text" },
  { key: "automation_capability", label: "Automation Capability", kind: "text" },
  { key: "good_for", label: "Good For", kind: "text", placeholder: "coding, Android builds, local inference..." },
  { key: "poor_for", label: "Poor For", kind: "text", placeholder: "large local models, long builds..." },
  { key: "notes", label: "Notes", kind: "text" },
];