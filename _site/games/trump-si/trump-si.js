const FACE_ROWS = 8;
const ORANGE = { r: 255, g: 112, b: 0 };
const INPUT_CAP = 180;

const MOODS = {
  happy: {
    face: "happy",
    border: "#3dff6a",
    label: "HE LIKES IT",
    footer: "Green frame. He likes it. Return sends. Up recalls."
  },
  winning: {
    face: "winning",
    border: "#ffd24a",
    label: "WINNING",
    footer: "Gold frame. Winning. Return sends. Up recalls."
  },
  smug: {
    face: "smug",
    border: "#ff8c00",
    label: "THE BEST",
    footer: "Orange frame. His ordinary mood. Return sends. Up recalls."
  },
  neutral: {
    face: "neutral",
    border: "#4cc3ff",
    label: "COMPUTING",
    footer: "Blue frame. He is thinking. Return sends. Up recalls."
  },
  fake: {
    face: "fake",
    border: "#c084fc",
    label: "FAKE NEWS",
    footer: "Purple frame. Fake news. Return sends. Up recalls."
  },
  rant: {
    face: "rant",
    border: "#ff2d2a",
    label: "VERY ANGRY",
    footer: "Red frame. He is angry. Return sends. Up recalls."
  },
  sad: {
    face: "sad",
    border: "#a8c0dc",
    label: "SAD!",
    footer: "Pale frame. Sad. Return sends. Up recalls."
  }
};

const TUNES = {
  happy: { type: "square", gain: 0.045, gap: 0.11, hold: 0.16, notes: [523, 659, 784] },
  winning: { type: "square", gain: 0.05, gap: 0.1, hold: 0.18, notes: [392, 523, 659, 784] },
  smug: { type: "square", gain: 0.04, gap: 0.14, hold: 0.18, notes: [196, 247] },
  neutral: { type: "sine", gain: 0.04, gap: 0.12, hold: 0.14, notes: [440, 554] },
  fake: { type: "triangle", gain: 0.05, gap: 0.12, hold: 0.2, notes: [494, 370, 294] },
  rant: { type: "sawtooth", gain: 0.035, gap: 0.08, hold: 0.15, notes: [196, 140, 98, 73] },
  sad: { type: "triangle", gain: 0.04, gap: 0.18, hold: 0.24, notes: [392, 330, 262] }
};

const TOPIC_KEYS = [
  "goodbye", "sad", "fake", "rant",
  "who", "help", "memory", "love", "thanks",
  "ai", "china", "wall", "democrat", "economy", "russia",
  "winning", "greeting", "joke"
];

const VOICE_MALE = /male|david|daniel|alex|fred|aaron|guy|matthew|christopher|brian|james|eric|bruce|gordon|arthur|ralph|reed|junior|rishi|george|thomas|andrew|davis|jason|tony|roger|mark|ryan|tom/;
const VOICE_FEMALE = /female|woman|zira|samantha|victoria|fiona|moira|hazel|serena|allison|ava|kate|susan|karen|salli|ivy|aria|jenny|sara|natasha|libby|sonia|michelle|joanna|kimberly|kendra|nicole|emma|amy/;

function escapeReg(phrase) {
  return phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text, phrase) {
  return new RegExp("\\b" + escapeReg(phrase) + "\\b", "i").test(text);
}

function isNegated(text, phrase) {
  return new RegExp(
    "\\b(?:not|don'?t|doesn'?t|isn'?t|aren'?t|ain'?t|wasn'?t|weren'?t|hardly)\\s+(?:a\\s+|the\\s+|so\\s+|very\\s+|really\\s+|that\\s+|being\\s+)?(?:[\\w']+\\s+){0,3}" +
      escapeReg(phrase) +
      "\\b",
    "i"
  ).test(text);
}

function phraseWeight(phrase) {
  return phrase.trim().split(/\s+/).length > 1 ? 3 : 1;
}

function clipQuote(text) {
  const clean = String(text || "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= 46) return clean;
  const cut = clean.slice(0, 46);
  const space = cut.lastIndexOf(" ");
  return (space > 18 ? cut.slice(0, space) : cut).trim() + "...";
}

function saidLine(quote) {
  if (!quote) return "";
  const tidy = /[.!?]$/.test(quote) ? quote : quote + ".";
  return 'You said "' + tidy + '"';
}

function askedLine(quote) {
  if (!quote) return "";
  const tidy = /[.!?]$/.test(quote) ? quote : quote + "?";
  return 'You asked, "' + tidy + '"';
}

function formatNum(n) {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

function tryMath(text) {
  let match = text.match(/(-?\d{1,7})\s*(plus|\+|minus|times|x|×|\*|over|divided by|\/|÷)\s*(-?\d{1,7})/i);
  let left;
  let right;
  let op;
  let raw;
  if (match) {
    left = Number(match[1]);
    op = match[2].toLowerCase();
    right = Number(match[3]);
    raw = match[0];
  } else {
    match = text.match(/(-?\d{1,7})\s+-\s+(-?\d{1,7})/);
    if (!match) return null;
    left = Number(match[1]);
    right = Number(match[2]);
    op = "minus";
    raw = match[0];
  }
  const rest = text.replace(raw, " ").replace(/[^a-z0-9]+/gi, " ").trim();
  if (rest && rest.split(/\s+/).length > 6) return null;
  if (op === "/" || op === "÷" || op === "over" || op === "divided by") {
    if (right === 0) return { zero: true, raw: raw, shown: "" };
    return { zero: false, raw: raw, shown: formatNum(left / right) };
  }
  let value = left + right;
  if (op === "minus") value = left - right;
  else if (op === "*" || op === "x" || op === "×" || op === "times") value = left * right;
  else if (op !== "+" && op !== "plus") value = left + right;
  if (!Number.isFinite(value)) return null;
  return { zero: false, raw: raw, shown: formatNum(value) };
}

function isQuestion(text) {
  return /\?\s*$/.test(text) || /^(who|what|why|how|when|where|which|is|are|am|do|does|did|can|could|would|should|will|explain|describe)\b/i.test(text) || /^tell me\b/i.test(text);
}

function moodFor(key) {
  if (key === "praise" || key === "thanks" || key === "love" || key === "greeting") return "happy";
  if (key === "winning") return "winning";
  if (key === "insult" || key === "rant") return "rant";
  if (key === "fake") return "fake";
  if (key === "sad" || key === "goodbye") return "sad";
  if (key === "ai" || key === "question" || key === "math" || key === "who" || key === "help") return "neutral";
  return "smug";
}

function scoreTriggers(lower, table) {
  const scores = {};
  Object.keys(table).forEach(function (key) { scores[key] = 0; });
  Object.entries(table).forEach(function (pair) {
    const key = pair[0];
    pair[1].forEach(function (phrase) {
      if (!hasPhrase(lower, phrase)) return;
      const weight = phraseWeight(phrase);
      const negated = isNegated(lower, phrase);
      const praiseKey = key === "praise" || key === "love" || key === "thanks" || key === "winning";
      if (negated && praiseKey) scores.insult += weight;
      else if (negated && (key === "insult" || key === "fake")) scores.praise += weight;
      else if (!negated) scores[key] += weight;
    });
  });
  return scores;
}

function bestTopic(scores) {
  let topic = null;
  let topicScore = 0;
  TOPIC_KEYS.forEach(function (key) {
    const score = scores[key] || 0;
    if (score > topicScore) {
      topicScore = score;
      topic = key;
    }
  });
  return { topic: topic, topicScore: topicScore };
}

function judge(input, table) {
  const text = String(input || "").replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const triggers = table || (typeof window !== "undefined" ? window.triggers : {}) || {};
  const scores = scoreTriggers(lower, triggers);
  const praise = scores.praise || 0;
  const insult = scores.insult || 0;
  const found = bestTopic(scores);
  const math = tryMath(lower);
  const quote = clipQuote(text);
  let key = "fallback";
  let mood = "smug";

  if (math && insult === 0 && found.topicScore === 0) {
    key = "math";
    mood = praise > 0 ? "happy" : "neutral";
  } else if (insult > 0 && insult > praise && insult > found.topicScore) {
    key = "insult";
    mood = "rant";
  } else if (praise > 0 && praise > insult && praise > found.topicScore) {
    key = "praise";
    mood = "happy";
  } else if (found.topic && found.topicScore > 0) {
    key = found.topic;
    mood = moodFor(found.topic);
    if (insult > praise && found.topic !== "fake") mood = "rant";
    else if (praise > insult && (mood === "smug" || mood === "neutral")) mood = "happy";
  } else if (insult > 0 && insult >= praise) {
    key = "insult";
    mood = "rant";
  } else if (praise > 0) {
    key = "praise";
    mood = "happy";
  } else if (math) {
    key = "math";
    mood = "neutral";
  } else if (isQuestion(text)) {
    key = "question";
    mood = "neutral";
  }

  return {
    key: key,
    mood: mood,
    quote: quote,
    math: math,
    praise: praise,
    insult: insult,
    text: text
  };
}

function isMore(input) {
  return /^(and|go on|more|continue|what else|keep going|and then|don't stop|dont stop)\??$/i.test(String(input || "").trim());
}

function wrap(text, width) {
  const limit = Math.max(1, width | 0);
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return [""];
  const lines = [];
  let line = "";
  let len = 0;
  raw.split(" ").forEach(function (word) {
    const wordLen = Array.from(word).length;
    if (wordLen > limit) {
      if (line) {
        lines.push(line);
        line = "";
        len = 0;
      }
      const chars = Array.from(word);
      for (let i = 0; i < chars.length; i += limit) {
        const chunk = chars.slice(i, i + limit).join("");
        if (i + limit < chars.length) lines.push(chunk);
        else {
          line = chunk;
          len = Array.from(chunk).length;
        }
      }
      return;
    }
    if (!line) {
      line = word;
      len = wordLen;
      return;
    }
    if (len + 1 + wordLen <= limit) {
      line += " " + word;
      len += 1 + wordLen;
      return;
    }
    lines.push(line);
    line = word;
    len = wordLen;
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function pickFrom(arr, used) {
  if (!arr || !arr.length) return "";
  let choice = arr[Math.floor(Math.random() * arr.length)];
  for (let i = 0; i < 5; i += 1) {
    choice = arr[Math.floor(Math.random() * arr.length)];
    if (!used || used.indexOf(choice) === -1) break;
  }
  if (used) {
    used.push(choice);
    if (used.length > 24) used.shift();
  }
  return choice;
}

function joinParts(parts) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function clampParts(parts, limit) {
  const copy = parts.filter(Boolean);
  const max = limit || 420;
  while (copy.length > 1 && joinParts(copy).length > max) copy.pop();
  return joinParts(copy);
}

const HEARD_LEAD = /^(please\s+)?(can you|could you|would you|will you|tell me about|tell me|talk about|what about|how about|what do you think about|what do you think of|do you know about|do you know|who is|what is|what's|whats|why is|why are|how is|how do you|explain|describe)\s+/i;

function heard(text) {
  let stripped = String(text || "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  stripped = stripped.replace(HEARD_LEAD, "").replace(/[?!.,]+$/g, "").trim();
  if (stripped.length < 3) return "";
  if (stripped.length > 42) {
    const cut = stripped.slice(0, 42);
    const space = cut.lastIndexOf(" ");
    stripped = (space > 14 ? cut.slice(0, space) : cut).trim();
  }
  return stripped;
}

function capWord(phrase) {
  if (!phrase) return "";
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function hook(verdict, used) {
  const subject = heard(verdict.text);
  if (!subject) return "";
  if (verdict.key === "question") {
    return pickFrom([
      "You asked about " + subject + ".",
      capWord(subject) + ".",
      "About " + subject + "."
    ], used);
  }
  if (verdict.key === "fallback") {
    return pickFrom([
      "Look, " + subject + ".",
      "Many people are saying " + subject + ".",
      capWord(subject) + ". Interesting."
    ], used);
  }
  return "";
}

function poolFor(responses, key) {
  if (responses[key] && responses[key].length) return responses[key];
  return responses.fallback || ["Tremendous."];
}

function mathLine(math, used) {
  if (!math) return "";
  if (math.zero) {
    return pickFrom([
      "Divide by nothing? I don't do nothing. I do something. Tremendous somethings. Sad math.",
      "You can't divide by zero. Everybody knows. Even the low-information people know, and I'm telling you anyway."
    ], used);
  }
  return pickFrom([
    "It's " + math.shown + ". I did it in my head. The best head. Super intelligence, and I still had time left over.",
    math.raw + " is " + math.shown + ". The experts form a committee. I just know it. Everybody knows I know it.",
    math.shown + ". Obviously " + math.shown + ". You heard it here first, which is where the numbers come from."
  ], used);
}

function memoryLine(lastYou, responses, used) {
  if (!lastYou) return pickFrom(responses.memory, used);
  const quote = clipQuote(lastYou);
  return pickFrom([
    'You said "' + quote + '." I remember it. I remember everything. The best memory. A super memory.',
    "Earlier you told me \"" + quote + ".\" People forget. I don't. Super intelligence. The best memory.",
    pickFrom(responses.memory, used) + ' The line was "' + quote + '."'
  ], used);
}

function compose(state) {
  const responses = state.responses || {};
  const verdict = state.verdict || {};
  const mood = state.mood || verdict.mood || "smug";
  const used = state.used || [];
  if (verdict.key === "math") return mathLine(verdict.math, used);
  if (verdict.key === "memory") return memoryLine(state.lastYou, responses, used);

  const words = String(verdict.text || "").split(/\s+/).filter(Boolean).length;
  const quoteOk = words >= 2 && ["greeting", "goodbye", "thanks", "math", "who", "help", "sad"].indexOf(verdict.key) === -1;
  const quote = quoteOk ? verdict.quote : "";
  const personal = (mood === "happy" || mood === "winning")
    ? pickFrom(responses.praiseYou, used)
    : (mood === "rant" && verdict.key !== "rant" && (verdict.insult || 0) > (verdict.praise || 0))
      ? pickFrom(responses.insultYou, used)
      : "";
  const body = pickFrom(poolFor(responses, verdict.key), used);
  let extra = "";
  if (mood === "winning" && verdict.key !== "winning") extra = pickFrom(responses.winning, used);
  if (mood === "sad" && verdict.key !== "sad" && verdict.key !== "goodbye") extra = pickFrom(responses.sad, used);
  if (mood === "rant") extra = pickFrom(responses.rantTail, used);
  if (state.hot && mood === "rant") extra = joinParts([extra, pickFrom(responses.rantTail, used)]);
  let ai = "";
  if (verdict.key !== "ai" && verdict.key !== "who" && verdict.key !== "help" && verdict.key !== "greeting") {
    if ((mood === "neutral" || mood === "smug") && Math.random() < 0.22) ai = pickFrom(responses.aiBit, used);
  }
  const lead = verdict.key === "question" ? askedLine(quote) : saidLine(quote);
  const heardLine = hook(verdict, used);
  let shapes;
  let limit = 300;
  if (mood === "rant") {
    limit = 460;
    shapes = [
      [personal, body, extra],
      [body, extra],
      [personal, body]
    ];
  } else if (mood === "winning") {
    shapes = [
      [extra, personal, body],
      [extra, body],
      [body, extra]
    ];
  } else if (mood === "happy") {
    shapes = [
      [personal, body],
      [body, personal],
      [body]
    ];
  } else if (mood === "sad") {
    shapes = [
      [body, extra],
      [body],
      [heardLine, body]
    ];
  } else if (verdict.key === "question" || verdict.key === "fallback") {
    shapes = heardLine
      ? [[heardLine, body], [heardLine, body, ai]]
      : [[body], [body, ai], [lead, body]];
  } else if (mood === "fake") {
    shapes = [
      [body],
      [lead, body],
      [body, ai]
    ];
  } else {
    shapes = [
      [body],
      [body, ai],
      [lead, body]
    ];
  }
  let line = clampParts(shapes[Math.floor(Math.random() * shapes.length)], limit);
  if (state.recent && state.recent.indexOf(line) !== -1) {
    line = clampParts(shapes[Math.floor(Math.random() * shapes.length)], limit);
  }
  return line;
}

const VOICE_CADENCE = {
  happy: { rate: 1.0, pitch: 0.94 },
  winning: { rate: 1.04, pitch: 0.92 },
  smug: { rate: 0.94, pitch: 0.9 },
  neutral: { rate: 0.96, pitch: 0.92 },
  fake: { rate: 0.9, pitch: 0.86 },
  rant: { rate: 1.08, pitch: 0.88 },
  sad: { rate: 0.86, pitch: 0.82 }
};

const VOICE_PLAIN = /christopher|eric|guy|david|andrew|davis|aaron|matthew|brian|jason|tony|roger|mark|alex|george/;
const VOICE_NOVELTY = /bad news|bahh|bells|boing|bubbles|cellos|zarvox|trinoids|whisper|superstar|grandma|grandpa|junior|kathy|princess|organ|pipe|novelty|wobble|albert|fred/;

function forVoice(text) {
  let line = String(text || "").replace(/\s+/g, " ").trim();
  line = line.replace(/\bSI\b/g, "ess eye");
  line = line.replace(/\bA\.?I\.?\b/g, "ay eye");
  line = line.replace(/\s+\+\s+/g, " plus ");
  line = line.replace(/\s+\*\s+/g, " times ");
  line = line.replace(/\s+×\s+/g, " times ");
  if (line.length <= 420) return line;
  const cut = line.slice(0, 420);
  const stop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (stop > 140) return cut.slice(0, stop + 1);
  return cut;
}

function trumpPhrases(text) {
  const line = forVoice(text);
  if (!line) return [];
  const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [line];
  const phrases = [];
  sentences.forEach(function (sentence) {
    const trimmed = sentence.replace(/\s+/g, " ").trim();
    if (!trimmed) return;
    const words = trimmed.split(" ");
    let chunks = [trimmed];
    if (words.length > 12 && trimmed.indexOf(",") !== -1) {
      chunks = trimmed.split(/,\s+/).map(function (part, index, all) {
        const bit = part.trim();
        if (!bit) return "";
        if (index < all.length - 1 && !/[.!?]$/.test(bit)) return bit + ",";
        return bit;
      }).filter(Boolean);
    }
    chunks.forEach(function (chunk) {
      const bang = /!$/.test(chunk);
      const question = /\?$/.test(chunk);
      const comma = /,$/.test(chunk);
      const sadWord = /^sad\b/i.test(chunk);
      phrases.push({
        text: chunk,
        rate: sadWord ? 0.88 : bang ? 0.94 : question ? 1.02 : 1,
        pitch: sadWord ? 0.84 : bang ? 0.9 : question ? 1.1 : comma ? 1.03 : 0.97,
        volume: bang ? 1 : 0.97,
        gap: sadWord ? 200 : bang ? 160 : comma ? 80 : 120
      });
    });
  });
  return phrases.slice(0, 14);
}

function voiceScore(voice) {
  const name = (voice.name || "").toLowerCase();
  const lang = (voice.lang || "").toLowerCase();
  let score = 0;
  if (lang.indexOf("en-us") === 0) score += 8;
  else if (lang.indexOf("en") === 0) score += 2;
  if (lang.indexOf("en-gb") === 0 || lang.indexOf("en-au") === 0 || lang.indexOf("en-in") === 0) score -= 4;
  if (VOICE_FEMALE.test(name)) score -= 12;
  if (VOICE_MALE.test(name)) score += 5;
  if (VOICE_PLAIN.test(name)) score += 4;
  if (VOICE_NOVELTY.test(name)) score -= 8;
  return score;
}

function tuneLength(mood) {
  const tune = TUNES[mood] || TUNES.smug;
  if (!tune.notes.length) return 40;
  const last = (tune.notes.length - 1) * tune.gap + tune.hold;
  return Math.round((last + 0.08) * 1000);
}

const TrumpBrain = {
  judge: judge,
  compose: compose,
  wrap: wrap,
  isMore: isMore,
  moodFor: moodFor,
  tryMath: tryMath,
  MOODS: MOODS
};
window.TrumpBrain = TrumpBrain;

class TrumpSI {
  constructor(term) {
    this.term = term;
    this.history = [];
    this.sent = [];
    this.recallAt = -1;
    this.draft = "";
    this.mood = "smug";
    this.streak = 0;
    this.faceRows = FACE_ROWS;
    this.lastKey = "";
    this.used = [];
    this.recentLines = [];
    this.greetingLine = "";
    this.spoken = false;
    this.inputBuffer = "";
    this.faceImage = null;
    this.audioCtx = null;
    this.images = {};
    const files = {
      happy: "1.jpg",
      smug: "2.jpg",
      rant: "3.jpg",
      winning: "4.jpg",
      neutral: "5.jpg",
      fake: "6.jpg",
      sad: "7.jpg"
    };
    const self = this;
    Object.entries(files).forEach(function (pair) {
      const img = new Image();
      img.onload = function () {
        if (self.faceImage === img && self.term.core) {
          self.term.core.dirty = true;
          self.term.core.flush();
        }
      };
      img.src = pair[1];
      self.images[pair[0]] = img;
    });
    if (term.core && term.core.canvas) {
      term.core.canvas.add({ draw: function (ctx) { self.drawFace(ctx); } }, "face");
    }
    const synth = window.speechSynthesis;
    if (synth) {
      const prime = function () { self.pickVoice(synth.getVoices()); };
      synth.addEventListener("voiceschanged", prime);
      prime();
    }
  }

  layout() {
    const rows = this.term.rows;
    const minText = 5;
    let face = Math.round(rows * 0.4);
    if (face < 7) face = 7;
    if (rows - face - 1 < minText) face = Math.max(5, rows - 1 - minText);
    this.faceRows = face;
  }

  textRows() {
    return this.term.rows - this.faceRows - 1;
  }

  moodSpec() {
    return MOODS[this.mood] || MOODS.smug;
  }

  tint() {
    const spec = this.moodSpec();
    const canvas = this.term.canvas;
    if (canvas) {
      canvas.style.borderColor = spec.border;
      canvas.style.boxShadow = "0 0 18px " + spec.border + "88";
      canvas.dataset.mood = this.mood;
    }
    if (this.term.core) this.term.core.cursorColor = spec.border;
    if (this.term.footerEl) {
      this.term.footerEl.style.color = spec.border;
      this.term.footerEl.textContent = spec.footer;
    }
    if (this.term.headerMiddle) {
      this.term.headerMiddle.textContent = spec.label;
      this.term.headerMiddle.style.color = spec.border;
      this.term.headerMiddle.style.fontWeight = "700";
      this.term.headerMiddle.style.letterSpacing = "0.12em";
    }
  }

  audio() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    const engine = this.term.engine;
    let ctx = engine && engine.audio;
    if (!ctx) {
      if (!this.audioCtx) this.audioCtx = new Ctor();
      ctx = this.audioCtx;
      if (engine) engine.audio = ctx;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  playMood(mood) {
    try {
      const ctx = this.audio();
      const tune = TUNES[mood] || TUNES.smug;
      if (!ctx || !tune) return;
      const now = ctx.currentTime + 0.02;
      tune.notes.forEach(function (freq, index) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + index * tune.gap;
        osc.type = tune.type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(tune.gain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tune.hold);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + tune.hold + 0.02);
      });
    } catch (err) {}
  }

  pickVoice(voices) {
    if (!voices || !voices.length) return null;
    let best = voices[0];
    let bestScore = -999;
    for (let i = 0; i < voices.length; i += 1) {
      const score = voiceScore(voices[i]);
      if (score > bestScore) {
        bestScore = score;
        best = voices[i];
      }
    }
    this.voice = best;
    return best;
  }

  speak(text, mood, waitMs) {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance !== "function") return;
    const phrases = trumpPhrases(text);
    if (!phrases.length) return;
    this.hush();
    const token = this._speakToken;
    const base = VOICE_CADENCE[mood] || VOICE_CADENCE.smug;
    const self = this;
    const wait = Math.max(40, waitMs || 0);
    window.setTimeout(function () {
      if (token !== self._speakToken) return;
      const voice = self.pickVoice(synth.getVoices());
      self._utters = [];
      let index = 0;
      const step = function () {
        if (token !== self._speakToken) return;
        if (index >= phrases.length) return;
        const phrase = phrases[index];
        index += 1;
        const utter = new SpeechSynthesisUtterance(phrase.text);
        self._utters.push(utter);
        utter.lang = "en-US";
        if (voice) utter.voice = voice;
        const wobble = 0.98 + (index % 3) * 0.015;
        utter.rate = Math.max(0.72, Math.min(1.2, base.rate * phrase.rate * wobble));
        utter.pitch = Math.max(0.62, Math.min(1.25, base.pitch * phrase.pitch));
        utter.volume = phrase.volume;
        utter.onend = function () {
          if (token !== self._speakToken) return;
          window.setTimeout(step, phrase.gap);
        };
        try {
          synth.speak(utter);
          synth.resume();
        } catch (err) {}
      };
      step();
    }, wait);
  }

  hush() {
    this._speakToken = (this._speakToken || 0) + 1;
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (err) {}
  }

  armVoice() {
    this.audio();
    if (this.spoken) return;
    this.spoken = true;
    this.playMood(this.mood);
    this.speak(this.greetingLine, this.mood, tuneLength(this.mood));
  }

  showFace(mood) {
    this.mood = MOODS[mood] ? mood : "smug";
    this.faceImage = this.images[this.moodSpec().face] || this.images.neutral || null;
    this.tint();
  }

  drawFace(ctx) {
    const core = this.term.core;
    if (!core) return;
    const cw = core.cellWidth;
    const ch = core.cellHeight;
    const spec = this.moodSpec();
    const faceRows = this.faceRows || FACE_ROWS;
    const top = 0;
    const band = faceRows * ch;
    const width = core.cols * cw;
    ctx.save();
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, top, width, band);
    const topPad = Math.max(8, Math.round(ch * 0.45));
    const labelH = Math.max(12, Math.round(ch * 0.9));
    const gap = Math.max(3, Math.round(ch * 0.16));
    let size = Math.floor(band - labelH - gap - topPad - 2);
    size = Math.max(32, Math.min(size, width - 16));
    const block = topPad + size + gap + labelH;
    const y = top + topPad + Math.floor(Math.max(0, band - block) / 2);
    const x = Math.round((width - size) / 2);
    const radius = Math.max(8, Math.round(size * 0.06));
    const image = this.faceImage;
    ctx.beginPath();
    roundBox(ctx, x, y, size, radius);
    ctx.closePath();
    if (image && image.complete && image.naturalWidth) {
      ctx.save();
      ctx.clip();
      const iw = image.naturalWidth;
      const ih = image.naturalHeight;
      const scale = Math.max(size / iw, size / ih);
      const sw = size / scale;
      const sh = size / scale;
      const sx = (iw - sw) / 2;
      const sy = Math.max(0, (ih - sh) * 0.2);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(image, sx, sy, sw, sh, x, y, size, size);
      ctx.restore();
    }
    ctx.beginPath();
    roundBox(ctx, x, y, size, radius);
    ctx.closePath();
    ctx.strokeStyle = spec.border;
    ctx.lineWidth = this.mood === "rant" ? 5 : 4;
    ctx.shadowColor = spec.border;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 4;
    ctx.fillStyle = spec.border;
    ctx.font = "bold " + Math.max(11, Math.floor(ch * 0.72)) + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.label, width / 2, y + size + gap + labelH / 2);
    ctx.restore();
  }

  wrapText(text) {
    return wrap(text, this.term.cols);
  }

  pushLine(lines, text, style) {
    this.wrapText(text).forEach(function (line) {
      lines.push({ text: line, style: style });
    });
  }

  transcript() {
    const lines = [];
    const trump = { rgb: ORANGE, bold: true };
    const you = { fg: 15, bold: false };
    if (!this.history.length) {
      this.pushLine(lines, "TRUMP SI: " + (this.greetingLine || ""), trump);
      return lines;
    }
    const self = this;
    this.history.forEach(function (turn, index) {
      if (index) lines.push({ text: "", style: you });
      self.pushLine(lines, "YOU: " + turn.you, you);
      lines.push({ text: "", style: you });
      self.pushLine(lines, "TRUMP SI: " + turn.trump, trump);
    });
    while (lines.length && lines[lines.length - 1].text === "") lines.pop();
    return lines;
  }

  paintStyled(col, row, text, style) {
    const core = this.term.core;
    this.term.moveTo(col, row);
    core.fg = style && style.fg != null ? style.fg : 15;
    core.bg = 0;
    core.fgRgb = style && style.rgb ? { r: style.rgb.r, g: style.rgb.g, b: style.rgb.b } : null;
    core.bgRgb = null;
    core.bold = !!(style && style.bold);
    core.bright = !!(style && style.bright);
    this.term.write(text);
    core.fgRgb = null;
    core.bold = false;
    core.bright = false;
  }

  paint() {
    this.layout();
    const lines = this.transcript();
    const room = this.textRows();
    const visible = lines.slice(-room);
    const start = this.faceRows;
    this.term.clear();
    const self = this;
    visible.forEach(function (line, index) {
      if (!line.text) return;
      self.paintStyled(0, start + index, line.text, line.style);
    });
    const max = Math.max(1, this.term.cols - 3);
    const chars = Array.from(this.inputBuffer);
    const shown = chars.length <= max ? this.inputBuffer : chars.slice(chars.length - max).join("");
    this.paintStyled(0, this.term.rows - 1, "> ", { rgb: ORANGE, bold: true });
    this.paintStyled(2, this.term.rows - 1, shown, { fg: 15, bold: false });
    this.term.showCursor();
    this.tint();
  }

  applyMood(baseMood) {
    let mood = baseMood;
    if (mood === "happy" || mood === "winning") {
      this.streak = this.streak > 0 ? this.streak + 1 : 1;
      if (mood === "happy" && this.streak >= 2) mood = "winning";
    } else if (mood === "rant") {
      this.streak = this.streak < 0 ? this.streak - 1 : -1;
    } else if (this.streak > 0) {
      this.streak -= 1;
    } else if (this.streak < 0) {
      this.streak += 1;
    }
    return mood;
  }

  reply(input) {
    let verdict = judge(input, window.triggers);
    if (isMore(input) && this.lastKey && this.lastKey !== "math") {
      verdict = {
        key: this.lastKey,
        mood: moodFor(this.lastKey),
        quote: "",
        math: null,
        praise: 0,
        insult: this.streak < 0 ? 1 : 0,
        text: input
      };
      if (this.mood === "rant" || this.streak < 0) verdict.mood = "rant";
    }
    const mood = this.applyMood(verdict.mood);
    const lastYou = this.history.length ? this.history[this.history.length - 1].you : "";
    const line = compose({
      verdict: verdict,
      mood: mood,
      responses: window.responses || {},
      lastYou: lastYou,
      used: this.used,
      recent: this.recentLines,
      hot: this.streak <= -2
    });
    this.recentLines.push(line);
    if (this.recentLines.length > 6) this.recentLines.shift();
    this.lastKey = verdict.key;
    this.history.push({ you: input, trump: line });
    if (this.history.length > 8) this.history.shift();
    this.sent.push(input);
    if (this.sent.length > 32) this.sent.shift();
    this.recallAt = -1;
    this.draft = "";
    this.inputBuffer = "";
    this.spoken = true;
    this.playMood(mood);
    this.speak(line, mood, tuneLength(mood));
    this.showFace(mood);
    this.paint();
  }

  recall(step) {
    if (!this.sent.length) return;
    if (step < 0) {
      if (this.recallAt < 0) {
        this.draft = this.inputBuffer;
        this.recallAt = this.sent.length - 1;
      } else if (this.recallAt > 0) {
        this.recallAt -= 1;
      }
      this.inputBuffer = this.sent[this.recallAt];
      return;
    }
    if (this.recallAt < 0) return;
    if (this.recallAt >= this.sent.length - 1) {
      this.recallAt = -1;
      this.inputBuffer = this.draft;
      return;
    }
    this.recallAt += 1;
    this.inputBuffer = this.sent[this.recallAt];
  }

  start() {
    this.mood = "happy";
    this.streak = 0;
    this.greetingLine = pickFrom((window.responses && window.responses.greeting) || ["Hello."], this.used);
    this.inputBuffer = "";
    this.showFace(this.mood);
    this.paint();
  }

  destroy() {
    this.hush();
  }
}

function roundBox(ctx, x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
}

window.TrumpSI = TrumpSI;

function bootTrump() {
  const container = document.getElementById("game");
  if (!container || typeof Glass !== "function") return;
  const term = new Glass({
    cols: 72,
    rows: 22,
    title: "🤖 Trump Super Intelligence",
    border: MOODS.happy.border,
    footer: MOODS.happy.footer,
    cursor: MOODS.happy.border
  });
  container.appendChild(term.wrap);
  const bot = new TrumpSI(term);

  function live() {
    return typeof isGameLive !== "function" || isGameLive();
  }

  function onKey(event) {
    if (!live()) return;
    if (event.key === "Enter" || event.key === "NumpadEnter") {
      event.preventDefault();
      const line = bot.inputBuffer.trim();
      if (line) bot.reply(line);
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const chars = Array.from(bot.inputBuffer);
      if (!chars.length) return;
      chars.pop();
      bot.inputBuffer = chars.join("");
      bot.recallAt = -1;
      bot.paint();
      return;
    }
    if (event.key === "ArrowUp") {
      bot.recall(-1);
      bot.paint();
      return;
    }
    if (event.key === "ArrowDown") {
      bot.recall(1);
      bot.paint();
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (Array.from(bot.inputBuffer).length >= INPUT_CAP) return;
      bot.inputBuffer += event.key;
      bot.recallAt = -1;
      bot.paint();
    }
  }

  function onPaste(event) {
    if (!live()) return;
    const data = event.clipboardData || window.clipboardData;
    const text = data && data.getData("text");
    if (!text) return;
    event.preventDefault();
    const clean = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
    const room = INPUT_CAP - Array.from(bot.inputBuffer).length;
    if (room <= 0) return;
    bot.inputBuffer += Array.from(clean).slice(0, room).join("");
    bot.recallAt = -1;
    bot.paint();
  }

  term.onKey(onKey);
  term.wrap.addEventListener("paste", onPaste);
  bot.start();

  const desk = window.GameDesk;
  if (desk) {
    const prevOpen = desk.onOpen;
    const prevClose = desk.onClose;
    desk.onOpen = function () {
      if (typeof prevOpen === "function") prevOpen();
      bot.armVoice();
    };
    desk.onClose = function () {
      bot.hush();
      if (typeof prevClose === "function") prevClose();
    };
  } else {
    term.focus();
  }

  return function () {
    term.wrap.removeEventListener("paste", onPaste);
    bot.destroy();
    term.destroy();
  };
}

if (typeof useEffect === "function") {
  useEffect(bootTrump);
}
