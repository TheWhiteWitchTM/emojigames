const responses = {
  greeting: [
    "Hello, you're looking at the most intelligent person ever, frankly. Many people are saying it.",
    "Tremendous to meet you. I have the best words, everyone knows that.",
    "Nobody knows more about this than me. Believe me.",
    "Big hello. The biggest. People are talking about how smart I am."
  ],
  best: [
    "I'm the best at this. Nobody does it better, believe me.",
    "Everybody knows it. The ratings are through the roof.",
    "We have the best people. The absolute best.",
    "It's tremendous. The most tremendous."
  ],
  fake: [
    "That's fake news. Total witch hunt. Sad!",
    "The fake news media won't tell you the truth. Very dishonest.",
    "They're very dishonest people. The worst.",
    "Fake news is the enemy of the people. Everybody knows that."
  ],
  rant: [
    "Let me tell you, we've been treated very unfairly. The system is rigged, everyone knows it. But we're winning so much, you're gonna get tired of winning.",
    "People come up to me, big strong people with tears in their eyes, and they say 'Sir, you're the only one who can fix this.' And they're right.",
    "It's a disgrace. A total disgrace. But we're going to make it great again.",
    "They never thought we could do it. But we did. And we're going to keep doing it."
  ],
  critical: [
    "Wrong. Completely wrong. I know more about this than anyone, and it's going to be huge.",
    "That's what they want you to think. But actually, we're doing numbers like nobody's ever seen.",
    "Many people are saying the opposite. And they're right, by the way.",
    "You don't know what you're talking about. I know more than the experts."
  ],
  winning: [
    "We're winning so much you're gonna get tired of winning.",
    "Tremendous success. The likes of which nobody has ever seen.",
    "I alone can fix it. Everybody knows that.",
    "We're doing better than anyone thought possible. The best."
  ],
  china: [
    "China is ripping us off. Bigly.",
    "They respect strength. And we have the strongest.",
    "We're going to make the best deals. The absolute best.",
    "China doesn't respect weakness. We don't do weakness."
  ],
  wall: [
    "We're building the wall. And Mexico is going to pay for it.",
    "The wall is coming. It's going to be a beautiful wall.",
    "We need the wall. Everybody knows we need the wall.",
    "The wall is going up. It's a beautiful thing."
  ],
  memory: [
    "You said that earlier. And I remember everything. The best memory.",
    "People forget, but I don't. I have the greatest memory.",
    "That's what I was saying before. Consistency is important."
  ],
  fallback: [
    "Look, I don't know, but I can tell you this: we're going to make it great again. Tremendous.",
    "Many people are saying that. And they're right, by the way.",
    "Nobody's ever done it better. Believe me.",
    "It's going to be huge. The biggest. Everyone's talking about it.",
    "We're going to figure it out. The best people are on it.",
    "That's interesting. But actually, the real story is how well we're doing.",
    "I know more about this than anyone. Trust me."
  ]
};

const triggers = {
  greeting: ["hello", "hi", "hey", "how are you", "good morning"],
  best: ["best", "greatest", "smartest", "winning", "tremendous", "genius"],
  fake: ["fake", "news", "media", "cnn", "witch hunt", "dishonest", "lie"],
  rant: ["why", "explain", "unfair", "rigged", "election", "disgrace", "corrupt"],
  critical: ["wrong", "lie", "false", "bad", "fail", "stupid", "idiot", "dumb"],
  winning: ["win", "winning", "success", "great again", "tremendous"],
  china: ["china", "chinese", "beijing", "xi"],
  wall: ["wall", "border", "mexico", "immigration"],
  memory: ["remember", "said", "earlier", "before", "told"]
};

window.responses = responses;
window.triggers = triggers;
