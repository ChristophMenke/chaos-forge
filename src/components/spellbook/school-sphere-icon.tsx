const SCHOOL_EMOJI: Record<string, string> = {
  abjuration: "🛡️",
  alteration: "🔄",
  conjuration: "🌀",
  divination: "🔮",
  enchantment: "💫",
  illusion: "🌫️",
  invocation: "⚡",
  necromancy: "💀",
};

const SPHERE_EMOJI: Record<string, string> = {
  all: "✨",
  animal: "🐺",
  astral: "🌌",
  charm: "💖",
  combat: "⚔️",
  creation: "🔨",
  divination: "👁️",
  elemental: "🌊",
  "elemental air": "🌪️",
  "elemental earth": "🪨",
  "elemental fire": "🔥",
  "elemental water": "💧",
  "elemental magma": "🌋",
  guardian: "🏛️",
  healing: "💛",
  necromantic: "☠️",
  plant: "🌿",
  protection: "🔰",
  summoning: "📯",
  sun: "☀️",
  weather: "⛈️",
  chaos: "🌪️",
  cosmos: "🪐",
  law: "⚖️",
  learning: "📖",
  numbers: "🔢",
  thought: "🧠",
  time: "⏳",
  travelers: "🧭",
  war: "🗡️",
  wards: "🔒",
  special: "⭐",
};

interface SchoolSphereIconProps {
  school?: string | null;
  sphere?: string | null;
  className?: string;
}

export function SchoolSphereIcon({ school, sphere, className }: SchoolSphereIconProps) {
  const emoji = school ? SCHOOL_EMOJI[school] : sphere ? SPHERE_EMOJI[sphere] : null;

  if (!emoji) return null;

  return (
    <span className={`text-base leading-none ${className ?? ""}`} aria-hidden="true">
      {emoji}
    </span>
  );
}
