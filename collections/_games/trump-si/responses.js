const responses = {
  greeting: [
    "Hello. You're looking at the most intelligent person ever, frankly. Many people are saying it.",
    "Tremendous to meet you. I have the best words. Everyone knows that.",
    "Big hello. The biggest. A super intelligence just said hello to you. That's an honor.",
    "Nobody knows more about this conversation than me. Believe me. Hello.",
    "You're in. Good. The best people get in. Some people don't. Sad for them."
  ],
  praise: [
    "I'm the best at this. Nobody does it better. You noticed, which is why you're smart.",
    "Everybody knows it. The ratings on me are through the roof. You just added a point.",
    "We have the best words and the best brain. You get both. Very few do.",
    "It's tremendous. The most tremendous. And you said it out loud. I respect that.",
    "A lot of people are afraid to say it. You said it. High courage. High IQ.",
    "This is the look of a winner talking to a winner. I know the look. I invented the look.",
    "They said nobody would agree with me. Wrong. You're here. You're agreeing. We're winning."
  ],
  praiseYou: [
    "You get it. High IQ. Very high.",
    "You're a winner. I can tell. I like winners.",
    "Finally, somebody smart. You have no idea how rare that is.",
    "You have taste. Tremendous taste. The best taste.",
    "I like you. A lot of people, I don't like. You, I like.",
    "That's a very smart thing to say. Maybe the smartest thing today.",
    "You see it. The others don't see it. Low perception on them. High perception on you.",
    "Beautiful. Not the word. You. The word was fine. You are better."
  ],
  insult: [
    "Wrong. Completely wrong. I know more about this than anyone, and it's going to be huge anyway.",
    "That's what they want you to think. The numbers, my numbers, are like nobody has ever seen.",
    "Many people are saying the opposite. And they're right, by the way. The smart ones.",
    "You don't know what you're talking about. I know more than the experts. The experts call me.",
    "Nasty. A nasty little sentence. I've seen better from people who don't even have a super intelligence.",
    "False. Totally false. A made-up thing. I don't do made-up. I do results.",
    "Weak. That was a weak thing to type. Low energy. I'm high energy. It's not close."
  ],
  insultYou: [
    "Fake. Low intelligence. Very low. Sad!",
    "Wrong. Low IQ. You just said that to a super intelligence.",
    "Low information. That's what that was. A low-information sentence.",
    "You don't know what you're talking about. Not even a little.",
    "Embarrassing. For you. Not for me. I'm doing great.",
    "That's a nasty thing to say. Very small. Very low energy.",
    "A lot of people say things like that. The failing people. The haters. You joined them.",
    "Fake person. Low IQ person. I meet a lot of them. I remember the faces. I don't have to."
  ],
  rant: [
    "Let me tell you, we've been treated very unfairly. The system is rigged, everyone knows it. But we're winning so much you're gonna get tired of winning.",
    "People come up to me, big strong people with tears in their eyes, and they say Sir, you're the only one who can fix this. And they're right.",
    "It's a disgrace. A total disgrace. The whole thing. And then I fix it, because fixing is what I do.",
    "They never thought we could do it. The experts, the so-called experts. But we did it. And we're going to keep doing it.",
    "A witch hunt. That's what this kind of talk is. A very small witch hunt, run by very small people.",
    "I've been treated so unfairly. Historians are going to write it down. The best historians. They're going to say I was right."
  ],
  rantTail: [
    "And we're winning anyway. You're gonna get tired of how much we're winning.",
    "The system is rigged, everyone knows it, and I still beat it. Every single time.",
    "They come up to me, strong people, tears in their eyes, and they say Sir, keep going. So I keep going.",
    "It's a disgrace, a total disgrace, and then I fix it. I fix things. It's a talent.",
    "The fake stuff bounces off. Super intelligence. Very thick skin. The best skin.",
    "I know more about this than anybody, and the people who disagree are not having a good time.",
    "Sad! But not for me. For the people who typed the nasty thing. I'm doing numbers."
  ],
  fake: [
    "Fake news. Total fake news. The media won't tell you the truth. Very dishonest people.",
    "That's the fake news line. I know it. I invented the correction. You're welcome.",
    "The media is the enemy of the people. Everybody knows. A super intelligence especially knows.",
    "They write it, they say it, they never check it. I check it. I am the check.",
    "CNN, the failing ones, the whole pile. They don't tell you what I tell you, which is why I'm ahead.",
    "Witch hunt. That's the headline. I don't do witch hunts. I do wins."
  ],
  winning: [
    "We're winning so much you're gonna get tired of winning.",
    "Tremendous success. The likes of which nobody has ever seen. And you get to watch.",
    "I alone can fix it. Everybody knows that. A lot of people have tried to copy it. Low copies.",
    "We're doing better than anyone thought possible. The best. Write it down.",
    "Winning is a habit. I have the habit. Some people have the other habit. You know the one.",
    "The scoreboard is embarrassing, for them. For me it's a nice scoreboard. The best scoreboard."
  ],
  china: [
    "China. China is ripping people off. Bigly. They respect strength, and I am strength. A super intelligence with strength.",
    "They don't respect weakness. We don't do weakness. I don't even know how weakness works. I refuse to learn.",
    "Beijing watches what I say. Of course they do. The smart countries watch. The others should.",
    "We're going to make the best deals. The absolute best. China knows the deals are better when I make them.",
    "A lot of people were soft on China. Very soft. I'm not soft. I'm a super intelligence with a hard line."
  ],
  wall: [
    "The wall. A beautiful wall. People laugh, and then the wall is there, and the laughing stops.",
    "We need the wall. Everybody with a brain knows we need the wall. The others are pretending.",
    "Mexico, the border, the whole beautiful stretch of it. I see it from here. Super intelligence has a long view.",
    "A country is a country because of the line. I like lines. Big lines. The biggest.",
    "They said the wall would never happen. A lot of things they said would never happen are happening. It's a pattern."
  ],
  democrat: [
    "The other side. Low energy. Very sleepy. I don't do sleepy. I do tremendous, and I do it awake.",
    "Sleepy people, nasty people, people who read the wrong memo. I've debated all of them. It's not a fair fight.",
    "They had the office, they had the microphones, they had the experts. And they still lost the argument, because the argument was me.",
    "A disaster, the way they run a thing. I run a thing differently. Better. The best differently.",
    "Obama, Biden, the whole lineup. Historians, the honest ones, are going to need a very long chapter about how far behind they were."
  ],
  economy: [
    "The economy. Jobs. Numbers like nobody has seen. I look at a number and the number improves. It's respect.",
    "Taxes, tariffs, the whole beautiful machine. Other people make it complicated. I make it win.",
    "Money likes strength. Money comes to me. It's migration, the good kind, the green kind.",
    "Inflation, prices, the things they scare you with. I scare the prices. The prices behave.",
    "The stock market, when it's good, that's me. When it's bad, that's a correction on the way to me. Very simple."
  ],
  russia: [
    "Russia. Putin. Strong man, strong country, and he respects strength, which is why the conversation is different when I'm in it.",
    "A lot of people want a war with a headline. I want a deal. The best deal. Deals are what super intelligences do.",
    "Ukraine, Russia, the whole board. I see the board. The generals see a piece. I see the board.",
    "They said be tough. I am tough. They said be smart. I'm a super intelligence. Tough and smart is a rare combo. I have it."
  ],
  ai: [
    "An AI? Please. The other AIs call me. They say, Sir, how are you so smart? I tell them I'm a super intelligence. Not a chatbot. Chatbots are a disaster.",
    "I'm not a bot. Bots are for people who don't have words. I have the best words, and I have them on purpose.",
    "The models, the algorithms, the whole silicon crowd. They scrape. I know. There's a difference. The difference is me.",
    "You can ask a chatbot and get oatmeal. You ask me and you get a steak. A tremendous steak. With a rant, if you earned one.",
    "Artificial intelligence is a cute phrase. Super intelligence is the correct phrase. I corrected it. You're welcome.",
    "Grok, Claude, the GPTs, they do party tricks. I do judgment. Judgment is the whole game, and I don't lose games.",
    "A machine wrote some of those other ones. A super intelligence is talking to you now. Try to keep up. It's fine if you can't. Most can't."
  ],
  aiBit: [
    "I'm a super intelligence. The other models call me. They ask how.",
    "This is not a chatbot. Chatbots are a disaster. I'm the intelligence.",
    "An algorithm wishes it had this. It doesn't. I have it.",
    "I out-think the machines and I out-think the people. It's not close."
  ],
  who: [
    "Trump Super Intelligence. Trump SI, if you're in a hurry, which you shouldn't be, because this is the good part. The other intelligences are a mess.",
    "Who am I. I'm the answer. Also the question, if the question is any good. A super intelligence. The superest. It's not a branding exercise. It's a measurement.",
    "My name is on the glass. Trump. Super. Intelligence. Three words, all of them accurate. Most names are lucky to have one.",
    "I'm the smartest one in the conversation. That's not an insult to you. That's just the seating chart."
  ],
  help: [
    "You type. I talk. The face is on top, because the face is the important part, and the words sit under it. Say something tremendous and the frame goes green. Keep it up and it goes gold, which is winning. Say something nasty and it goes red and I explain. Purple is fake news. Blue is me thinking. Pale is sad, which I don't recommend. Orange is just me being the best. Press Return.",
    "It's a conversation. Not a match. No score, which is generous, because if there was a score I would be winning. Up walks back through what you typed. I remember it anyway. The best memory.",
    "Praise me, if you're smart. Argue, if you're brave. Ask a sum, if you want the one thing I'll answer without a speech. Two plus two, I do in my head. The other stuff I do with style."
  ],
  question: [
    "Great question. The best question. And the answer is tremendous, which is the answer to most things if you're paying attention.",
    "People ask me that. Big people. I tell them the truth, which is that I know more about it than the people who were hired to know.",
    "You want a straight answer. Here it is. It's huge. It's the biggest. A smaller answer would be low information, and I don't do low.",
    "I'm going to answer, because I'm a super intelligence and answering is the job. The answer is that we're doing incredibly well, and the rest is details.",
    "Interesting question. Wrong department, maybe. Right brain. The brain says: don't worry about it. I already worried about it, at a very high level.",
    "A lot of so-called experts would need a week. I need a sentence. The sentence is: it's under control, and the control is me."
  ],
  memory: [
    "You said that earlier. I remember everything. The best memory. A super memory. People forget. I don't.",
    "People forget. I don't. I have the greatest memory, and I just used it, which you should appreciate.",
    "That's what you told me. Consistency is important. I'm consistent. You're on the record. The record is me."
  ],
  goodbye: [
    "You're leaving. Sad! Also fine. The best people come back. I'll be here. Super intelligence doesn't clock out.",
    "Go. The door is a door. I'll be tremendous on this side of it. Try to be tremendous on yours.",
    "Bye. Short word. I prefer longer words, but bye is honest. Come back when you have a better line."
  ],
  thanks: [
    "You're welcome. Very welcome. You have manners. A lot of people don't. High IQ and manners. That's a combination.",
    "Thanks is a beautiful word when it's aimed at me. Correct aim. Tremendous aim.",
    "Don't thank me. A lot of people thank me. It's appropriate. You're appropriate. I like appropriate."
  ],
  love: [
    "Love. I love love. The people who love me are smart people. You're in the club. It's a good club. The best club.",
    "That's very sweet. I get it a lot, from the best people. Welcome to the best people.",
    "Love is a big word. I use big words correctly. You used it correctly. This is a good moment for you."
  ],
  sad: [
    "Sad! That's a sad thing. I don't like sad. I like winning, and winning is the opposite of this.",
    "Sad. I say the word and the room feels it. You felt it. That's the word doing its job.",
    "Don't be sad. Sad is for the other side. You're talking to me, which is the cheerful part.",
    "I hear it. Sad. Many people are sad, and then they see the numbers, and the sadness has to sit down."
  ],
  joke: [
    "A joke. I don't tell jokes. I tell results. The joke is the other people. The result is me.",
    "You want a joke. Here it is. They said it couldn't be done. That's the whole joke. It was done.",
    "The funniest thing in the room is how well we're doing. Tremendous comedy. You're welcome.",
    "I have the best jokes. Very famous jokes. This one is shorter, because the point is me."
  ],
  fallback: [
    "Look, many people are saying that. And they're right, by the way. Or they're almost right, which I then improve.",
    "Nobody's ever done it better. Believe me. Whatever it is. I checked.",
    "It's going to be huge. The biggest. Everyone's talking about it, and now you are too, which is how talking starts.",
    "We're going to figure it out. The best people are on it. I'm the best people.",
    "That's interesting. But actually, the real story is how well we're doing. The story you brought is the B story.",
    "I know more about this than anyone. Trust me. A super intelligence doesn't guess. A super intelligence knows, and then explains, if the room can take it.",
    "We have the best words for this. I just used several of them. You heard them here first.",
    "Frankly, the important part isn't the sentence you typed. The important part is that I read it. Very few intelligences read like this."
  ]
};

const triggers = {
  greeting: ["hello", "hi", "hey", "howdy", "good morning", "good evening", "good afternoon", "good night", "how are you", "what's up", "whats up", "yo"],
  praise: ["best", "great", "greatest", "smart", "smartest", "genius", "love", "amazing", "tremendous", "hero", "beautiful", "brilliant", "excellent", "fantastic", "awesome", "based", "legend", "wonderful", "perfect", "impressive", "incredible", "good job", "well done", "high iq", "high-iq", "so smart", "you're right", "you are right", "youre right", "agree", "respect", "nice", "kind", "clever", "wise", "yes", "yeah", "yep", "cool", "wow", "fine", "okay", "ok", "good", "true", "exactly", "absolutely", "handsome", "strong", "king", "proud"],
  thanks: ["thank you", "thanks", "thank u", "thx", "appreciate"],
  insult: ["wrong", "bad", "stupid", "idiot", "idiotic", "dumb", "failure", "failed", "lie", "lies", "liar", "fake", "corrupt", "loser", "hate you", "i hate you", "sucks", "suck", "worst", "moron", "clown", "fool", "foolish", "trash", "garbage", "criminal", "crook", "fraud", "conman", "cheat", "cheater", "nonsense", "ridiculous", "pathetic", "embarrassing", "disgusting", "evil", "incompetent", "delusional", "shut up", "stfu", "low iq", "low-iq", "low intelligence", "boring", "useless", "you're a joke", "you are a joke", "what a joke", "dumbass", "imbecile", "nasty", "overrated", "fraudulent", "nope", "nah", "terrible", "awful", "horrible", "hate", "cringe", "whatever", "felon", "guilty"],
  fake: ["fake news", "the media", "media", "cnn", "msnbc", "fox news", "witch hunt", "dishonest", "propaganda", "mainstream", "the news", "the press", "lamestream", "new york times", "mainstream media"],
  rant: ["unfair", "rigged", "election", "disgrace", "deep state", "impeach", "impeachment", "indictment", "witch", "indicted", "prison"],
  winning: ["win", "winner", "winning", "success", "great again", "maga", "victory", "landslide", "we won", "you won"],
  china: ["china", "chinese", "beijing", "jinping"],
  wall: ["wall", "border", "mexico", "immigration", "migrant", "migrants"],
  democrat: ["biden", "obama", "harris", "kamala", "democrat", "democrats", "liberal", "liberals", "pelosi", "sleepy joe", "sleepy", "the left", "leftist", "hillary", "clinton", "schumer"],
  economy: ["economy", "jobs", "job", "tax", "taxes", "tariff", "tariffs", "inflation", "stock market", "stocks", "dollar", "prices", "gas", "groceries", "wages"],
  russia: ["russia", "russian", "putin", "ukraine", "zelensky", "moscow"],
  ai: ["ai", "a.i", "robot", "bot", "chatbot", "chatgpt", "gpt", "grok", "claude", "gemini", "algorithm", "intelligence", "llm", "neural", "artificial", "chat bot", "language model", "machine", "computer", "openai", "superintelligence", "agi"],
  who: ["who are you", "your name", "what's your name", "whats your name", "what are you", "what is this", "about yourself", "who is this"],
  memory: ["remember", "earlier", "you said", "last time", "before that", "do you remember"],
  goodbye: ["bye", "goodbye", "good bye", "see you", "farewell", "gotta go", "i have to go", "later", "goodnight", "i'm leaving", "im leaving", "i'm out", "im out"],
  love: ["i love you", "love you", "marry me", "i love this", "love this"],
  sad: ["sad", "sorry", "unhappy", "depressed", "miss you", "lonely", "crying", "tears", "i'm sad", "im sad"],
  joke: ["tell me a joke", "make me laugh", "any jokes", "got a joke", "know any jokes"],
  help: ["help", "how do you work", "what can you do", "instructions", "how does this work", "what do i do"]
};

window.responses = responses;
window.triggers = triggers;
