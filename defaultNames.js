const adjectives = [
    "big", "small", "fast", "slow", "beautiful", "ugly", "bright", "dark", "loud", "quiet",
    "strong", "weak", "hot", "cold", "warm", "cool", "friendly", "mean", "funny", "serious", 
    "happy", "sad", "angry", "calm", "intelligent", "dumb", "wise", "foolish", "lazy", "hardworking", 
    "honest", "dishonest", "kind", "cruel", "brave", "cowardly", "rich", "poor", "wealthy", "broke", 
    "clean", "dirty", "messy", "organized", "tidy", "untidy", "new", "old", "young", "ancient", 
    "modern", "vintage", "beautiful", "ugly", "short", "long", "tall", "short", "wide", "narrow", 
    "smooth", "rough", "soft", "hard", "sharp", "blunt", "hot", "cold", "wet", "dry", 
    "bright", "dim", "colorful", "monochrome", "lively", "boring", "energetic", "lazy", "creative", "dull", 
    "mysterious", "obvious", "complicated", "simple", "abstract", "concrete", "healthy", "unhealthy", "fresh", 
    "rotten", "fresh", "spoiled", "fluffy", "sparse", "dense", "sparse", "clear", "cloudy", 
    "beautiful", "ugly", "extraordinary", "ordinary", "special", "plain", "delicious", "disgusting", "bitter", 
    "sweet", "salty", "sour", "spicy", "tasty", "bland", "strong", "mild", "rich", "weak",
    "old", "new", "classic", "modern"
];

const cities = [
    // China
    "shanghai", "beijing", "chongqing", "guangzhou", "shenzhen",
    
    // India
    "delhi", "mumbai", "kolkata", "bangalore", "chennai",
    
    // United States
    "new-york", "los-angeles", "chicago", "houston", "phoenix",
    
    // Indonesia
    "jakarta", "surabaya", "bandung", "medan", "semarang",
    
    // Brazil
    "são-paulo", "rio-de-janeiro", "salvador", "brasília", "fortaleza",
    
    // Pakistan
    "karachi", "lahore", "faisalabad", "rawalpindi", "multan",
    
    // Bangladesh
    "dhaka", "chattogram", "khulna", "rajshahi", "sylhet",
    
    // Russia
    "moscow", "saint-petersburg", "novosibirsk", "yekaterinburg", "nizhny-novgorod",
    
    // Japan
    "tokyo", "yokohama", "osaka", "nagoya", "sapporo",
    
    // Mexico
    "mexico-city", "guadalajara", "monterrey", "puebla", "cancún",
    
    // Egypt
    "cairo", "alexandria", "giza", "shubra-el-kheima", "port-said",
    
    // Philippines
    "manila", "quezon-city", "caloocan", "davao", "cebu",
    
    // Vietnam
    "ho-chi-minh-city", "hanoi", "haiphong", "can-tho", "da-nang",
    
    // Turkey
    "istanbul", "ankara", "izmir", "bursa", "adana",
    
    // Iran
    "tehran", "mashhad", "isfahan", "karaj", "shiraz",
    
    // South Korea
    "seoul", "busan", "incheon", "daegu", "daejeon",
    
    // Thailand
    "bangkok", "nonthaburi", "chiang-mai", "pattaya", "hat-yai",
    
    // United Kingdom
    "london", "birmingham", "manchester", "glasgow", "leeds",
    
    // France
    "paris", "marseille", "lyon", "toulouse", "nice",
    
    // Germany
    "berlin", "hamburg", "munich", "cologne", "frankfurt",
    
    // Italy
    "rome", "milan", "naples", "turin", "palermo",
    
    // Canada
    "toronto", "montreal", "vancouver", "calgary", "ottawa",
    
    // Australia
    "sydney", "melbourne", "brisbane", "perth", "adelaide"
];

const animals = [
    "dog", "cat", "elephant", "lion", "tiger", "bear", "zebra", "giraffe", "rabbit", "panda", 
    "kangaroo", "koala", "horse", "monkey", "snake", "crocodile", "leopard", "cheetah", "wolf", "fox", 
    "deer", "owl", "parrot", "eagle", "falcon", "penguin", "whale", "dolphin", "shark", "octopus", 
    "jellyfish", "starfish", "seal", "hippopotamus", "rhinoceros", "bison", "buffalo", "antelope", "camel", "camel", 
    "swan", "duck", "goose", "turkey", "chicken", "rooster", "hen", "rabbit", "hamster", "gerbil", 
    "guinea-pig", "rat", "mouse", "bat", "squirrel", "chipmunk", "otter", "badger", "ferret", "weasel", 
    "skunk", "beaver", "mole", "shrew", "koala", "wallaby", "wombat", "sloth", "porcupine", "armadillo", 
    "hedgehog", "coyote", "jackal", "raccoon", "opossum", "moose", "elk", "ibex", "goat", "sheep", 
    "cow", "pig", "horse", "donkey", "llama", "alpaca", "yak", "bison", "ox", "reindeer", 
    "dromedary", "gazelle", "impala", "springbok", "marlin", "trout", "bass", "catfish", "salmon", "carp"
];

const objects = [
    "hammer", "screwdriver", "pliers", "wrench", "drill", "saw", "level", "tape-measure", "utility-knife", 
    "ladder", "bucket", "broom", "dustpan", "mop", "vacuum", "iron", "ironing-board", "paintbrush", "paint-roller",
    "screwdriver-set", "toolbox", "drill-bits", "nails", "screws", "tacks", "picture-hangers", "glue-gun", 
    "glue-sticks", "caulk", "caulking-gun", "sandpaper", "putty-knife", "plunger", "toilet-brush", "toilet-plunger",
    "lawn-mower", "shovel", "rake", "hoe", "pruning-shears", "hedge-trimmer", "weed-whacker", "garden-fork", 
    "watering-can", "hose", "sprinkler", "wheelbarrow", "snow-shovel", "flashlight", "batteries", "extension-cord", 
    "surge-protector", "power-strip", "lightbulb", "lightbulb-changer", "torch", "wire-cutters", "pipe-wrench", 
    "clamp", "duct-tape", "masking-tape", "electrical-tape", "gloves", "safety-glasses", "earplugs", "work-gloves", 
    "cordless-drill", "jack", "crowbar", "claw-hammer", "rubber-mallet", "pipe-cutter", "hole-saw", "wire-strippers", 
    "multimeter", "thermometer", "soldering-iron", "zip-ties", "cable-ties", "plumbing-snake", "funnel", "tongs", 
    "spade", "ice-pick", "axe", "hatchet", "chainsaw", "pruning-saw", "tool-belt", "workbench", "clamps", "vise",
    "band-saw", "jigsaw", "bench-grinder", "soldering-kit", "cordless-screwdriver", "stud-finder", "thermometer", 
    "paint-scraper", "floor-scraper", "pipe-bender", "tarp", "drop-cloth", "wood-glue", "clothesline", "clothes-pins", 
    "clothes-hanger", "drying-rack", "sewing-kit", "sewing-machine", "fabric-scissors", "needle", "thread", 
    "safety-pin", "measuring-cup", "measuring-spoon", "thermometer", "bottle-opener", "can-opener", "funnel", "strainer"
];