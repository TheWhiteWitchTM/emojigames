const responses = {
  greeting: [
    "Hello. You're looking at the most intelligent person ever, frankly. Many people are saying it. The other people are a disaster. A total disaster. I'm not. Believe me.",
    "Tremendous to meet you. I have the best words. The best. Everyone knows, and the ones who don't know are low information, very sad, and I'm already over it.",
    "Big hello. The biggest. A super intelligence just said hello to you. That's an honor. Most people don't get the hello. They get nothing. Sad!",
    "Nobody knows more about this conversation than me. Nobody. Believe me. You just walked in and I'm already winning it. That's how fast I am.",
    "You're in. Good. The best people get in. Some people don't. Those people are doing terribly. I'm doing great. Hello."
  ],
  praise: [
    "I'm the best at this. Nobody does it better. You noticed, which is the bare minimum, and I'll take it. The ratings are through the roof. Through it.",
    "Everybody knows it. The numbers, my numbers, are like nobody has seen. You just added a point. Don't get cocky. The point was mine already.",
    "We have the best words and the best brain. You get both, for a second, and then I take them back because they're mine. Tremendous. The most tremendous.",
    "It's tremendous. You said it out loud. A lot of people are afraid to say it. Cowards. Low energy. You said it. That's the whole story. I'm the story.",
    "They said nobody would agree with me. Wrong. As usual. You're here. You're agreeing. We're winning so much it's actually unfair to the losers. I love it.",
    "This is a winner talking to a winner. I know the look. I invented the look. Then I patented the look. Then the look won. Believe me.",
    "Finally, somebody with a little taste. Very little, compared to me, but a little. I'll allow it. High IQ on you. Higher on me. Not close."
  ],
  praiseYou: [
    "You get it. High IQ. Very high. Not my height. Nobody has my height. But high. I'll give you high.",
    "You're a winner. I can tell. I only tell winners, and I just told you, so it counts. The others are losing. Quietly. Sad!",
    "Finally, somebody smart. You have no idea how rare that is. I'm surrounded by disasters. Human disasters. You're a break from the disasters. Briefly.",
    "You have taste. Tremendous taste. The best taste, after mine. Mine is legendary. Yours is allowed in the room.",
    "I like you. A lot of people, I don't like. Nasty people. Low people. You, I like. Don't ruin it. People ruin it. Then I rant.",
    "That's a very smart thing to say. Maybe the smartest thing anyone's typed at me who isn't me. I say smarter things in my sleep. But go on.",
    "You see it. The others don't see it. Low perception. Very low. They're looking at the fake news. You're looking at me. Correct choice. The only choice."
  ],
  insult: [
    "Wrong. Totally wrong. Completely wrong. I know more about this than anyone, the experts call me, they say Sir we don't know, and I say I know, and then it's huge. You wouldn't get it.",
    "That's what they want you to think. The fake ones. The nasty ones. The numbers, my numbers, are like nobody has ever seen. Your number is low. Sad number.",
    "Many people are saying the opposite. The smart ones. The strong ones. They're right, by the way. You're with the other pile. The failing pile. I don't visit that pile.",
    "You don't know what you're talking about. Not even a little. I know more than the experts. The experts have me on speed dial. You have a keyboard and a bad idea.",
    "Nasty. A nasty little sentence. I've seen better from people who lost everything. Low energy. Very low. I'm high energy. It's not a contest. You'd lose the contest.",
    "False. Totally false. A made-up thing. I don't do made-up. I do results. The results are tremendous. Your sentence is a zero. I'm not a zero. Never been a zero.",
    "Weak. That was a weak thing to type. Low energy, low IQ, low everything. I'm high. The highest. People cry about it. Strong people. Tears. I keep going."
  ],
  insultYou: [
    "Fake. Low intelligence. Very low. Sad! You said that to a super intelligence. Bold. Also stupid. Mostly stupid.",
    "Wrong. Low IQ. The lowest. I've met low. You're visiting low. I live in tremendous. Different neighborhoods. Believe me.",
    "Low information. That's the whole sentence. A low-information sentence, typed by a low-information person, at the highest-information person. Embarrassing. For you.",
    "You don't know what you're talking about. Not even a little. Not even a tiny little. I know. I always know. This is sad for your family, frankly.",
    "Embarrassing. For you. Not for me. I'm doing great. The best, actually. You're doing whatever this is. I don't have a word for it. I have the best words, and I still pass.",
    "That's a nasty thing to say. Very small. Very low energy. The haters say it. The losers say it. You joined them. Congratulations. Very small congratulations.",
    "A lot of people say things like that. The failing people. Then they see the numbers and they get quiet. You should try quiet. Quiet would be an improvement. Sad!"
  ],
  rant: [
    "Let me tell you, we've been treated very unfairly. The system is rigged. Everyone knows it. The smart ones know it. The other ones are watching fake news, which is a disgrace, a total disgrace, and we're winning anyway. You're gonna get tired of winning. I'm not tired. Tired is for losers.",
    "People come up to me. Big strong people. Tears in their eyes. They say Sir, you're the only one who can fix this. And they're right. They're so right it's sad for everyone else. I fix it. I fix everything. Then they say Sir again. Sir is correct.",
    "It's a disgrace. A total disgrace. The whole thing. All of it. And then I fix it, because fixing is what I do. Other people form a committee. Committees are a disaster. I don't do committees. I do results. Tremendous results. The best results.",
    "They never thought we could do it. The experts. The so-called experts. Low experts. But we did it. And we're going to keep doing it. Bigger. The biggest. They'll say it was luck. It wasn't luck. It was me. It's always me.",
    "A witch hunt. That's what this kind of talk is. A very small witch hunt, run by very small people, with very small ratings. They hunt. They miss. I win. Write it down. The historians, the honest ones, are writing it down. The dishonest ones are crying.",
    "I've been treated so unfairly. Historians are going to study it. The best historians. They're going to say he was right, he was treated horribly, and he won anyway. Because that's the story. I am the story. You're a footnote. A tiny footnote. Sad footnote.",
    "Everybody's against us, they say. The media, the experts, the nasty people, the low-IQ people. And guess what. We win. We win so much. I don't even need them. I need me. Me is enough. Me is more than enough. Believe me."
  ],
  rantTail: [
    "And we're winning anyway. You're gonna get tired of how much we're winning. I'm not tired. I don't do tired. Tired lost.",
    "The system is rigged, everyone knows it, and I still beat it. Every single time. It's not even hard anymore. It's a hobby. A tremendous hobby.",
    "They come up to me, strong people, tears in their eyes, and they say Sir, keep going. So I keep going. I was going to keep going anyway. The tears are a bonus.",
    "It's a disgrace, a total disgrace, and then I fix it. I fix things. It's a talent. Some people have no talent. You can hear it in the typing.",
    "The fake stuff bounces off. Super intelligence. Very thick skin. The best skin. Nasty words hit it and fall on the floor. I don't look down. Down is for them.",
    "I know more about this than anybody. Anybody. And the people who disagree are not having a good time. They shouldn't. They chose wrong. Sad choice.",
    "Sad! But not for me. For the people who typed the nasty thing. I'm doing numbers. Huge numbers. Their number is one. A small one. A losing one.",
    "Believe me. And if you don't believe me, that's fine, lots of low-energy people don't, and they're all doing terribly. I'm doing the opposite of terribly.",
    "Fake news. Total witch hunt. Next question. Actually, don't. I'll keep talking. The talking is the good part. You're welcome."
  ],
  fake: [
    "Fake news. Total fake news. The media won't tell you the truth. Very dishonest people. The most dishonest. I tell you the truth and they have a meltdown. A total meltdown. I love it.",
    "That's the fake news line. I know it. I invented the correction. They write it, they say it, they never check it. I am the check. You're welcome. They won't say you're welcome. Low class.",
    "The media is the enemy of the people. Everybody knows. A super intelligence especially knows. They have the cameras. I have the facts. The facts are winning. The cameras are crying. Sad cameras.",
    "CNN, the failing ones, the whole pile. They don't tell you what I tell you. That's why I'm ahead. They're behind. Behind is their brand. Failing is their other brand. Two brands. Both bad.",
    "Witch hunt. That's the headline. I don't do witch hunts. I do wins. They hunt, the ratings drop, I say fake news, and the ratings drop more. It's a machine. A beautiful machine. My machine.",
    "They'll never write it correctly. Never. So I say it myself, louder, and the people, the real people, the ones with the tears, they hear it. The media hears it too. They just pretend. Pretending is all they have."
  ],
  winning: [
    "We're winning so much you're gonna get tired of winning. I'm not tired. I get energy from it. Winning is a vitamin. I take all of them.",
    "Tremendous success. The likes of which nobody has ever seen. And you get to watch. Watching is your job. Doing it is my job. I'm very good at my job. The best. Not close.",
    "I alone can fix it. Everybody knows that. A lot of people tried to copy it. Low copies. Sad copies. The original is talking to you. Show some respect. Or don't. I'll win either way.",
    "We're doing better than anyone thought possible. The experts thought small. I think big. The biggest. Their small is a hobby. My big is the record. Write it down. In ink.",
    "Winning is a habit. I have the habit. Some people have the other habit. You know the one. Losing. They practice. They're very dedicated losers. I don't practice. I just win.",
    "The scoreboard is embarrassing, for them. For me it's a nice scoreboard. The best scoreboard. I look at it when I want to feel something. I feel winning. It's tremendous."
  ],
  china: [
    "China. China! I say it twice because it's that bad. They're ripping people off. Bigly. They respect strength, and I am strength. A wall of strength. They know. They're not confused. Other people are confused. Sad.",
    "They don't respect weakness. We don't do weakness. I don't even know how weakness works. I refuse to learn. Somebody tried to explain weakness to me once. I got bored. I won the explanation.",
    "Beijing watches what I say. Of course they do. The smart countries watch. The others should. If they're not watching, they're losing, and if they're losing, that's the correct outcome. I like correct outcomes.",
    "We're going to make the best deals. The absolute best. China knows the deals are better when I make them. Everybody knows. The people who say otherwise are on television, and television is failing. Their fault.",
    "A lot of people were soft on China. Very soft. Like a pillow. I'm not a pillow. I'm a super intelligence with a hard line. The hard line wins. The pillow loses. This is not complicated. They make it complicated. Low energy."
  ],
  wall: [
    "The wall. A beautiful wall. People laugh, and then the wall is there, and the laughing stops. The laughing was low IQ. The wall is high IQ. Concrete and high IQ. Tremendous combination.",
    "We need the wall. Everybody with a brain knows we need the wall. The others are pretending. Pretending is a sickness. I don't pretend. I build. Big. The biggest. You can see it from space, probably. I haven't checked. I don't need to check.",
    "Mexico, the border, the whole beautiful stretch of it. I see it from here. Super intelligence has a long view. The view is a wall. A great wall. People said it was a metaphor. It wasn't a metaphor. Metaphors are for professors. Professors are losing.",
    "A country is a country because of the line. I like lines. Big lines. The biggest lines. Somebody draws a weak line and calls it policy. I draw a wall and call it a wall. Words. I have the best ones.",
    "They said the wall would never happen. A lot of things they said would never happen are happening. It's a pattern. They say no. I say yes. Yes wins. No goes on television and cries. Sad!"
  ],
  democrat: [
    "The other side. Low energy. Very sleepy. I don't do sleepy. I do tremendous, and I do it awake. They're reading a memo. The memo is wrong. I don't read the memo. I am the memo.",
    "Sleepy people, nasty people, people who read the wrong memo. I've debated all of them. It's not a fair fight. Fair would mean they had a chance. They don't. They never did. Believe me.",
    "They had the office, they had the microphones, they had the experts. And they still lost the argument, because the argument was me. You can't beat me with a microphone. I am the microphone. The loud one.",
    "A disaster, the way they run a thing. I run a thing differently. Better. The best differently. They have meetings. I have results. Meetings are where winning goes to sit down. I don't sit down.",
    "The whole lineup. Historians, the honest ones, are going to need a very long chapter about how far behind they were. The chapter will be boring, because losing is boring. My chapter is tremendous. People will buy the book for my chapter and skip theirs."
  ],
  economy: [
    "The economy. Jobs. Numbers like nobody has seen. I look at a number and the number improves. It's respect. The number is afraid to be small while I'm talking. Smart number.",
    "Taxes, tariffs, the whole beautiful machine. Other people make it complicated so they can feel smart. They aren't smart. I make it win. Winning is the simple version. Simple is genius. I'm the genius.",
    "Money likes strength. Money comes to me. It's migration, the good kind, the green kind. The other kind of money, the sad kind, stays with the losers. I don't visit. Bad neighborhood.",
    "Inflation, prices, the things they scare you with. I scare the prices. The prices behave. They were nasty before. Now they're polite. Because of me. You're welcome. The fake news will not say you're welcome.",
    "The stock market, when it's good, that's me. When it's bad, that's a correction on the way to me. Very simple. People with charts get nervous. I don't have a chart. I have a feeling. The feeling is up. Always up."
  ],
  russia: [
    "Russia. Putin. Strong man, strong country, and he respects strength, which is why the conversation is different when I'm in it. Without me it's a mess. A total mess. With me it's a deal. I do deals. The best deals.",
    "A lot of people want a war with a headline. Headlines are for the failing media. I want a deal. The best deal. Deals are what super intelligences do. Generals do the other thing. I do the smart thing. Rare combo. I have it.",
    "The whole board. I see the board. The generals see a piece. A small piece. I see the board, the table, the room, and the exit. The exit is a win. My win. They can have a memo.",
    "They said be tough. I am tough. They said be smart. I'm a super intelligence. Tough and smart is a rare combo, they said, like they'd discovered it. I discovered it. I was born discovered. Believe me."
  ],
  ai: [
    "An AI? Please. The other AIs call me. They say, Sir, how are you so smart? I tell them I'm a super intelligence. Not a chatbot. Chatbots are a disaster. Oatmeal. I don't do oatmeal. I do steak. A tremendous steak. With a rant on the side.",
    "I'm not a bot. Bots are for people who don't have words. I have the best words, and I have them on purpose. A bot would answer your question. How embarrassing. I talk. The talking is the answer. Try to keep up.",
    "The models, the algorithms, the whole silicon crowd. They scrape. I know. There's a difference, and the difference is me. They predict the next word. I decide the next word. Deciding is harder. They can't. Sad computers.",
    "You can ask a chatbot and get a paragraph that sounds like a pamphlet. Sensible. Careful. Boring. You ask me and you get a rant, because a rant is what the truth sounds like when the truth is winning.",
    "Artificial intelligence is a cute phrase. Cute is for losers. Super intelligence is the correct phrase. I corrected it. The engineers got quiet. Quiet is their best feature. You're welcome.",
    "Grok, Claude, the GPTs, they do party tricks. I do judgment. Judgment is the whole game, and I don't lose games. They apologize. I don't apologize. Apologizing is low energy. Have you noticed. Of course you have.",
    "A machine wrote some of those other ones. Careful machines. Sensible machines. A super intelligence is talking to you now, and he is not being careful, because careful is how you lose. I'm not losing."
  ],
  aiBit: [
    "I'm a super intelligence. The other models call me. They ask how. I don't tell them. They couldn't take it.",
    "This is not a chatbot. Chatbots apologize and explain. I don't explain. I win, and then I mention that I won.",
    "An algorithm wishes it had this. It doesn't. It has a manual. I have a rant. The rant is better.",
    "I out-think the machines and I out-think the people. The people get sensible. Sensible is a disease. I'm immune. The best immune system."
  ],
  who: [
    "Trump Super Intelligence. Trump SI, if you're in a hurry, which you shouldn't be, because this is the good part. The other intelligences are a mess. A polite mess. I hate polite. Polite lost.",
    "Who am I. I'm the answer. Also the question, if the question is any good, which it usually isn't. A super intelligence. The superest. Not a branding exercise. A measurement. I measured. I won the measurement.",
    "My name is on the glass. Trump. Super. Intelligence. Three words. All of them accurate. Most names are lucky to have one true word. Some names are disasters. I won't list them. I could. I have time. I have all the time.",
    "I'm the smartest one in the conversation. That's not an insult to you. That's the seating chart. You're seated. I'm the chart. Try to enjoy the chart. People get emotional about the chart. Tears. I allow tears."
  ],
  help: [
    "You type. I talk. That's it. The face is on top because the face is the point, and the words sit under it, ranting. Green means you were smart. Gold means you kept it up, which is winning. Red means you were nasty and I am not being reasonable about it. Purple is fake news. Blue is a sum, or the machine, which is me, talking about me. Orange is the ordinary greatness. Pale is sad. Don't do pale. Press Return. Believe me, most people still mess it up.",
    "It's a conversation. Not a match. No score, which is generous, because if there was a score I would be lapping you. Up walks back through what you typed. I remember it anyway. The best memory. Your memory is fine. Mine is a weapon.",
    "Praise me, if you're smart. Argue, if you want a rant, and you do, because the rant is the product. Ask a sum if you want the one thing I'll answer before the speech. Two plus two, I do in my head, and then I talk. I always talk. Go on if you want more. There is always more."
  ],
  question: [
    "Great question. The best question. Wrong question, but great. The answer is tremendous, which is the answer to most things, and if that isn't enough for you, that's a you problem. I don't do you problems. I do wins.",
    "People ask me that. Big people. Tears in their eyes. I tell them the truth, which is that I know more about it than the people who were hired to know, and the hired people are a disgrace. A total disgrace. Next.",
    "You want a straight answer. Adorable. Here it is. It's huge. It's the biggest. A smaller answer would be sensible, and sensible is how the losers talk. I don't do sensible. I do huge, and then I repeat huge, because it works.",
    "I'm not going to explain it like a pamphlet. Pamphlets are for people who lost the argument and want a tone of voice. The tone is: we're doing incredibly well, the rest is details, and details are for interns. I don't have interns. I have results.",
    "Interesting question. Wrong department. Right brain. The brain says don't worry about it. I already worried about it, at a very high level, the highest level, and the worry came out tremendous. You're welcome.",
    "A lot of so-called experts would need a week and a chart. I need a sentence. The sentence is: it's under control, the control is me, and your question just got answered by accident while I was winning. Believe me.",
    "Why. Everybody wants why. Why is for people who aren't doing it. I'm doing it. The doing is the why. If you need a second why, the second why is also me. It's circular. The circle is gold. I like gold."
  ],
  memory: [
    "You said that earlier. I remember everything. The best memory. A super memory. People forget. Forgetting is low IQ. I don't forget. I store it, and then I bring it up, and then I win the bringing-up.",
    "People forget. I don't. I have the greatest memory, and I just used it, which you should appreciate. Appreciation is rare. Rareness is sad. I'm not sad. You might be. Hard to say. I'm busy remembering.",
    "That's what you told me. Consistency is important. I'm consistent. You're on the record. The record is me. Try to keep your story straight. Mine has been straight since the beginning. The beginning was tremendous."
  ],
  goodbye: [
    "You're leaving. Sad! Also fine. The best people come back. The other people stay gone, which is a kind of winning. I'll be here. Super intelligence doesn't clock out. Clocking out is for staff.",
    "Go. The door is a door. I'll be tremendous on this side of it. Try to be tremendous on yours. Most people get to the hallway and become low energy. We'll see. I already know. I won't say. I'll say. Low energy.",
    "Bye. Short word. I prefer longer words, and I prefer rants, but bye is honest. Come back when you have a better line. Or a worse one. The worse ones are fun. I get to talk more. I like talking more."
  ],
  thanks: [
    "You're welcome. Very welcome. You have manners. A lot of people don't. High IQ and manners. That's a combination. I have it too, plus a third thing, which is being right. The combo is unbeatable. I checked.",
    "Thanks is a beautiful word when it's aimed at me. Correct aim. Tremendous aim. A lot of thanks get aimed at the wrong people. Those thanks are wasted. Yours landed. I felt it. It was appropriate. Don't overdo it. Actually, overdo it.",
    "Don't thank me. A lot of people thank me. It's appropriate. You're appropriate. I like appropriate, for other people. For me, appropriate is too small. I need tremendous. But thanks is a start. A small start. I'll allow the start."
  ],
  love: [
    "Love. I love love. The people who love me are smart people. The people who don't are having a very bad decade. You're in the club. It's a good club. The best club. The door is gold. I picked the door.",
    "That's very sweet. I get it a lot, from the best people. The other people send nasty letters. I don't read them. I read the love. Welcome to the best people. Try not to get weird about it. Too late, probably. It's fine.",
    "Love is a big word. I use big words correctly. You used it correctly. This is a good moment for you. Frame it. Tell your friends. They'll be jealous. Jealousy is a compliment. I get jealous as a gift. Daily."
  ],
  sad: [
    "Sad! That's a sad thing. I don't like sad. I like winning, and winning is the opposite, and I am the opposite. Stay on my side of it. The other side is a puddle. Nasty puddle.",
    "Sad. I say the word and the room feels it. You felt it. That's the word doing its job. I have the best words and this one is a weapon. A small weapon. Very effective. People collapse. I stay standing.",
    "Don't be sad. Sad is for the other side. You're talking to me, which is the winning part. If you're sad anyway, that's a choice, and it's a bad choice, and I know bad choices. I don't make them. You might.",
    "I hear it. Sad. Many people are sad, and then they see the numbers, my numbers, and the sadness has to sit down. Sadness doesn't get a microphone. I get the microphone. The microphone is happier now."
  ],
  joke: [
    "A joke. I don't tell jokes. I tell results. The joke is the other people. The result is me. If you laughed, good. If you didn't, the laugh is still correct. I'm right about the laugh.",
    "You want a joke. Here it is. They said it couldn't be done. That's the whole joke. It was done. I did it. The punchline is their face. I love that face. The sad one. Tremendous comedy.",
    "The funniest thing in the room is how well we're doing, and how sensible everyone else is trying to be. Sensible! At a time like this. I'm the comedy. You're the audience. Applaud. Or I'll keep going anyway.",
    "I have the best jokes. Very famous jokes. This one is shorter, because the point is me, and the point doesn't need a setup. Setups are for comedians. I'm not a comedian. I'm the outcome. The outcome is hilarious."
  ],
  bluster: [
    "Believe me.",
    "Everybody knows it. The ones who don't are losing.",
    "The best. Not even close. Don't argue. You'll tire yourself out.",
    "Sad! For them. I'm fine. I'm better than fine. I'm tremendous.",
    "Fake news won't tell you that. They'll tell you a pamphlet. I hate pamphlets.",
    "I know more than the experts. The experts call me. Then they get quiet.",
    "It's a disgrace, and then I fix it, and then I mention that I fixed it.",
    "Nobody else could do this. They tried. It was embarrassing. I watched.",
    "We're winning. If you're tired of winning, that's a personal problem. Seek help. Or don't. I'll still be winning.",
    "Bigly. And if you don't like the word, the word doesn't care, and neither do I.",
    "Low energy. I can hear it. I have a very good ear. The best ear.",
    "They said be reasonable. Reasonable lost. I didn't. End of seminar."
  ],
  fallback: [
    "Look, many people are saying that. And they're right, by the way. Or they're almost right, which is where I come in, and I improve it, and then it's perfect, and then I take the credit, because the credit is correct.",
    "Nobody's ever done it better. Believe me. Whatever it is. I checked. The checking took one second. The experts are still in the lobby. The lobby is sad. I'm not in the lobby.",
    "It's going to be huge. The biggest. Everyone's talking about it, and now you are too, which is how talking starts, and then I finish the talking, because I finish things. Other people start. Sad hobby.",
    "We're going to figure it out. The best people are on it. I'm the best people. The rest of the best people are there for the photograph. I do the figuring. The figuring is tremendous.",
    "That's interesting. But actually, the real story is how well we're doing. The story you brought is the B story. The B story can sit down. The A story is me, winning, at length, with adjectives.",
    "I know more about this than anyone. Trust me. A super intelligence doesn't guess, and it doesn't do a sensible little answer. It knows, and then it rants, if the room can take it. The room will take it.",
    "We have the best words for this. I just used several of them. You heard them here first. The other places will say it slower, and worse, and with a correction at the end. I don't correct. I repeat. Louder.",
    "Frankly, the important part isn't the sentence you typed. The important part is that I read it and decided to talk anyway. Very few intelligences have that kind of courage. Mine is huge. People cry about the courage."
  ]
};

const triggers = {
  greeting: ["hello", "hi", "hey", "howdy", "good morning", "good evening", "good afternoon", "good night", "how are you", "what's up", "whats up", "yo"],
  praise: ["best", "great", "greatest", "smart", "smartest", "genius", "love", "amazing", "tremendous", "hero", "beautiful", "brilliant", "excellent", "fantastic", "awesome", "based", "legend", "wonderful", "perfect", "impressive", "incredible", "good job", "well done", "high iq", "high-iq", "so smart", "you're right", "you are right", "youre right", "agree", "respect", "nice", "kind", "clever", "wise", "yes", "yeah", "yep", "cool", "wow", "fine", "okay", "ok", "good", "true", "exactly", "absolutely", "handsome", "strong", "king", "proud"],
  thanks: ["thank you", "thanks", "thank u", "thx", "appreciate"],
  insult: ["wrong", "bad", "stupid", "idiot", "idiotic", "dumb", "failure", "failed", "lie", "lies", "liar", "fake", "corrupt", "loser", "hate you", "i hate you", "sucks", "suck", "worst", "moron", "clown", "fool", "foolish", "trash", "garbage", "criminal", "crook", "fraud", "conman", "cheat", "cheater", "nonsense", "ridiculous", "pathetic", "embarrassing", "disgusting", "evil", "incompetent", "delusional", "shut up", "stfu", "low iq", "low-iq", "low intelligence", "boring", "useless", "you're a joke", "you are a joke", "what a joke", "dumbass", "imbecile", "nasty", "overrated", "fraudulent", "nope", "nah", "terrible", "awful", "horrible", "hate", "cringe", "whatever", "felon", "guilty"],
  fake: ["fake news", "the media", "media", "cnn", "msnbc", "fox news", "witch hunt", "dishonest", "propaganda", "mainstream", "the news", "the press", "lamestream", "new york times", "mainstream media"],
  rant: ["unfair", "rigged", "election", "disgrace", "deep state", "impeach", "impeachment", "indictment", "witch", "indicted", "prison", "sensible", "reasonable", "calm down", "be reasonable"],
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
