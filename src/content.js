export const COLS = 8;
export const ROWS = 11;
export const CLEAR_SIZE = 7;

export const ANIMALS = {
  sheep: { name: "sheep", plural: "sheep", color: "#f6eee2", accent: "#5f564d", pen: "the warm barn" },
  chicken: { name: "chicken", plural: "chickens", color: "#f5b95b", accent: "#a84636", pen: "the coop" },
  pig: { name: "pig", plural: "pigs", color: "#f08a99", accent: "#9d3d61", pen: "the pigsty" },
  goat: { name: "goat", plural: "goats", color: "#c7b3e8", accent: "#65528d", pen: "the hillside pen" }
};

export const TOOLS = {
  lantern: { id: "lantern", icon: "🏮", name: "Lantern", short: "Pause wolves", description: "Pauses the moon clock for the next 3 drops." },
  whistle: { id: "whistle", icon: "📯", name: "Shepherd's Whistle", short: "Call the herd", description: "Makes the next animal group match this Call's rescue animal." },
  bucket: { id: "bucket", icon: "🪣", name: "Water Bucket", short: "Wash mud", description: "Washes every muddy patch from the field." }
};

const call = (id, title, prompt, animal, target, threat, toolChoices, extras = {}) => ({
  id, title, prompt, animal, target, threat, toolChoices, ...extras
});

export const NIGHTS = [
  {
    id: "quiet-meadow",
    title: "The Quiet Meadow",
    landmark: "Barn lights",
    landmarkIcon: "⌂",
    landmarkColor: "#efbd64",
    note: "Mara strings lanterns across the barn. “No one gets left in the dark.”",
    calls: [
      call("first-flock", "Get the sheep inside", "Make 7 matching animals touch. This flock is already waiting for you.", "sheep", 1, "mud", ["lantern", "whistle"], { tutorial: "first", scripted: true }),
      call("coop-call", "Hush the coop", "Rescue a chicken herd before muddy paws reach the field.", "chicken", 1, "mud", ["bucket", "whistle"], { eggs: 2 }),
      call("meadow-mix", "One more rescue", "Send one goat herd to the hillside pen. A rescue pushes the moon back.", "goat", 1, "scatter", ["lantern", "bucket"])
    ]
  },
  {
    id: "slippery-crossing",
    title: "The Slippery Crossing",
    landmark: "Duck bridge",
    landmarkIcon: "⌇",
    landmarkColor: "#77c7d4",
    note: "The old bridge is steady again. The animals can cross at dawn.",
    calls: [
      call("pig-panic", "Clear a pig path", "Pig herds are brave together. Rescue two before the field gets muddy.", "pig", 2, "mud", ["bucket", "lantern"], { mud: 3 }),
      call("egg-run", "Egg run", "Golden eggs add bonus points when their herd gets home.", "chicken", 1, "scatter", ["whistle", "bucket"], { eggs: 5 }),
      call("bridge-watch", "Hold the crossing", "Rescue one sheep herd while wolves test the fence.", "sheep", 1, "fence", ["lantern", "whistle"])
    ]
  },
  {
    id: "windmill-howl",
    title: "The Windmill Howl",
    landmark: "Windmill",
    landmarkIcon: "✦",
    landmarkColor: "#b9d8f0",
    note: "The sails catch the dawn. The wolves fade into the far hills.",
    calls: [
      call("goat-rodeo", "Goat rodeo", "Rescue two goat herds. Clear a herd to slow the rising moon.", "goat", 2, "scatter", ["whistle", "lantern"]),
      call("mud-season", "Mud season", "Use a Bucket if the puddles crowd your plans.", "pig", 1, "mud", ["bucket", "bucket"], { mud: 6 }),
      call("fence-line", "Fence line", "A fence block is coming. Keep a chicken herd together.", "chicken", 1, "fence", ["lantern", "whistle"])
    ]
  },
  {
    id: "orchard-moon",
    title: "The Orchard Moon",
    landmark: "Apple orchard",
    landmarkIcon: "●",
    landmarkColor: "#e9836a",
    note: "A red apple rolls from the new orchard. Someone cheers from the barn.",
    calls: [
      call("orchard-flock", "Gather the flock", "Two sheep rescues turn the wolf pack toward the moon.", "sheep", 2, "scatter", ["lantern", "whistle"], { eggs: 4 }),
      call("piggyback", "Piggyback home", "The pigsty is close. Get two pig herds home.", "pig", 2, "mud", ["bucket", "lantern"]),
      call("moon-gate", "Shut the moon gate", "One last goat rescue keeps the gate standing.", "goat", 1, "fence", ["whistle", "bucket"])
    ]
  },
  {
    id: "full-moon",
    title: "The Full Moon",
    landmark: "Moon gate",
    landmarkIcon: "☾",
    landmarkColor: "#ffe798",
    note: "The moon gate shines bright. Tonight, the farm sleeps safely.",
    calls: [
      call("wolf-warning", "The wolf warning", "Rescue two chicken herds. Every rescue buys the farm more time.", "chicken", 2, "fence", ["lantern", "whistle"], { eggs: 5, mud: 2 }),
      call("all-hands", "All hands", "The farm needs two sheep herds before the last howl.", "sheep", 2, "scatter", ["bucket", "lantern"], { mud: 4 }),
      call("dawn-rescue", "Make it to dawn", "Rescue two goat herds. The moon is watching.", "goat", 2, "mud", ["whistle", "bucket"], { eggs: 3, mud: 3 })
    ]
  }
];

export const THREATS = {
  mud: { id: "mud", icon: "☔", name: "Muddy paws", description: "Wolves splash 3 muddy patches into the field." },
  scatter: { id: "scatter", icon: "〰", name: "Panic howl", description: "Wolves scatter 3 animals to nearby open grass." },
  fence: { id: "fence", icon: "⚑", name: "Fence breach", description: "Wolves block 2 field spaces with broken fence." }
};

export function nightForId(id) {
  return NIGHTS.find((night) => night.id === id) ?? NIGHTS[0];
}
