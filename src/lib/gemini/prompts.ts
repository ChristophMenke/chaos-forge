export const STYLE_BASE =
  "Dark fantasy illustration, muted earth tones with jewel accents, " +
  "painterly digital art style, medieval fantasy setting, " +
  "no modern elements, dark moody atmospheric lighting, " +
  "detailed but not photorealistic";

export const STYLE_PORTRAIT = `${STYLE_BASE}, portrait composition, dramatic lighting from above`;
export const STYLE_ICON = `${STYLE_BASE}, iconic symbol, centered, simple background, glowing magical effect`;
export const STYLE_LANDSCAPE = `${STYLE_BASE}, wide landscape composition, atmospheric perspective, cinematic`;

export function racePrompt(raceId: string): string {
  const descriptions: Record<string, string> = {
    human: "a seasoned human adventurer, weathered face, leather armor, torch in hand",
    elf: "an elegant high elf, pointed ears, flowing robes, ethereal glow, ancient wisdom",
    half_elf: "a half-elf ranger, blend of human ruggedness and elven grace, forest background",
    dwarf: "a stout dwarf warrior, braided beard, heavy plate armor, warhammer, mine entrance",
    gnome: "a clever gnome tinker, wild hair, goggles on forehead, gadgets and tools",
    halfling: "a cheerful halfling rogue, curly hair, bare feet, dagger and lockpicks, tavern",
    half_orc: "a fierce half-orc barbarian, tusks, scarred face, massive greataxe, tribal tattoos",
    kobold: "a scrappy kobold scout, reptilian features, oversized cloak, cunning eyes, cave",
    tiefling: "a mysterious tiefling warlock, small horns, tail, glowing eyes, arcane symbols",
  };
  return `${STYLE_PORTRAIT}. Portrait of ${descriptions[raceId] ?? raceId}`;
}

export function classPrompt(classId: string): string {
  const descriptions: Record<string, string> = {
    fighter: "a battle-hardened fighter in full plate armor, sword and shield, battlefield",
    ranger: "a wilderness ranger with longbow, hooded cloak, forest, animal companion",
    paladin: "a holy paladin in gleaming armor, radiant aura, holy symbol, divine light",
    mage: "a powerful wizard casting a spell, arcane energy swirling, spellbook, robes, staff",
    cleric: "a devout cleric in chainmail, holy symbol glowing, healing light, temple",
    crusader: "a zealous crusader in heavy armor, flaming sword, righteous fury, battlefield",
    druid: "a nature druid with staff, leaves in hair, shapeshifting aura, sacred grove",
    monk: "a disciplined monk in simple robes, martial arts stance, monastery, inner peace",
    shaman: "a tribal shaman with spirit mask, bone fetishes, ghostly spirits, ritual fire",
    thief: "a shadow thief in dark leather, daggers, lockpicks, moonlit rooftop, city skyline",
    bard: "a charismatic bard with lute, colorful cloak, tavern stage, captivated audience",
  };
  return `${STYLE_PORTRAIT}. Portrait of ${descriptions[classId] ?? classId}`;
}

export function schoolPrompt(school: string): string {
  const descriptions: Record<string, string> = {
    abjuration: "a glowing protective magical shield ward, blue energy barrier",
    alteration: "swirling transformation magic, object morphing into another form",
    conjuration: "a glowing summoning circle with portal energy, creature emerging",
    divination: "a crystal ball with swirling mist, all-seeing eye, prophetic visions",
    enchantment: "hypnotic swirling magical charm energy, glowing runes, mind magic",
    illusion: "a shimmering mirage, reality bending, phantom images overlapping",
    invocation: "explosive elemental energy burst, fire and lightning, raw arcane power",
    necromancy: "a skull with green ghostly energy, death magic, spectral hands rising",
  };
  return `${STYLE_ICON}. Magical icon representing ${descriptions[school] ?? school}`;
}

export function spherePrompt(sphere: string): string {
  const descriptions: Record<string, string> = {
    all: "a radiant divine light, universal holy symbol",
    animal: "a majestic wolf silhouette with divine glow",
    astral: "swirling astral plane portal with stars",
    charm: "a glowing heart-shaped divine rune",
    combat: "a holy flaming sword and shield",
    creation: "divine hands shaping matter from light",
    divination: "a divine eye surrounded by holy light",
    elemental: "four elements swirling together",
    "elemental air": "swirling wind vortex with divine light",
    "elemental earth": "glowing crystal emerging from stone",
    "elemental fire": "sacred divine flame",
    "elemental water": "holy water wave with divine glow",
    "elemental magma": "molten divine lava flow",
    guardian: "a divine shield with holy runes of protection",
    healing: "gentle golden healing light, hands",
    necromantic: "a holy ankh with spectral energy, life and death",
    plant: "a sacred tree with glowing leaves",
    protection: "a divine barrier of light",
    summoning: "a holy summoning circle, divine creature",
    sun: "a radiant sun disc with holy rays",
    weather: "divine storm clouds with holy lightning",
    chaos: "swirling chaotic divine energy",
    cosmos: "celestial stars and divine galaxy",
    law: "perfectly ordered divine runes, balance scales",
    learning: "a divine tome with glowing pages",
    numbers: "sacred geometric patterns with divine light",
    thought: "a glowing divine brain or mind symbol",
    time: "a divine hourglass with golden sand",
    travelers: "a divine compass rose with holy light",
    war: "divine crossed weapons with holy fire",
    wards: "layered divine protection glyphs",
    special: "a unique divine symbol with arcane sparkles",
  };
  return `${STYLE_ICON}. Small divine icon: ${descriptions[sphere] ?? sphere}`;
}

export function sessionPrompt(
  title: string,
  summary: string,
  entries?: { characterName: string; content: string }[]
): string {
  let context = "";
  if (summary) {
    context += summary.slice(0, 300);
  }
  if (entries && entries.length > 0) {
    const entryText = entries
      .map((e) => `${e.characterName}: ${e.content}`)
      .join(" | ")
      .slice(0, 400);
    context += (context ? " — " : "") + entryText;
  }
  if (!context) {
    context = title;
  }
  const safeTitle = title.slice(0, 120);
  return `${STYLE_LANDSCAPE}. A scene depicting: "${safeTitle}". Context: ${context}. Wide cinematic banner image, no text or letters in the image.`;
}
