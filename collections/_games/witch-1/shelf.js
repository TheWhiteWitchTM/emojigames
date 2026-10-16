// Programs that ship in the Witch ][ box. UNSEAL "shelf:NAME" loads one.
"use strict";
(function (root) {
  root.WITCH_SHELF = {
    HELLO: [
      "10 SCRUB",
      "20 CHANT \"STATE YOUR NAME.\"",
      "30 DEMAND N$",
      "40 IF N$ = \"\" THEN CHANT \"SHY. FINE. LEAVE.\" : DISPEL",
      "50 CHANT \"HELLO, \"; N$; \".\"",
      "60 CHANT \"I WILL NOT SAY IT TWICE.\"",
      "70 DISPEL"
    ].join("\n"),

    GUESS: [
      "10 SCRUB",
      "20 CHANT \"A NUMBER. 1 TO 100.\"",
      "30 CONJURE S = INT(RND(1) * 100) + 1",
      "40 CONJURE T = 0",
      "50 MARK AGAIN",
      "60 T = T + 1",
      "70 DEMAND \"GUESS\"; G",
      "80 IF G = S THEN FLYTO YES",
      "90 IF G < S THEN CHANT \"HIGHER. OBVIOUSLY.\" : FLYTO AGAIN",
      "100 CHANT \"LOWER. DO KEEP UP.\"",
      "110 FLYTO AGAIN",
      "120 MARK YES",
      "130 CHANT \"YES.\"; T; \" TRIES. ADORABLE.\"",
      "140 DISPEL"
    ].join("\n"),

    DICE: [
      "10 SCRUB",
      "20 DEMAND \"HOW MANY BONES\"; N",
      "30 IF N < 1 OR N > 12 THEN CHANT \"BETWEEN 1 AND 12.\" : FLYTO 20",
      "40 CURSE I = 1 TO N",
      "50 CONJURE R = INT(RND(1) * 6) + 1",
      "60 CHANT \"BONE\"; I; \":\"; R",
      "70 BREAK",
      "80 CHANT \"THAT IS ALL THE FATE YOU GET.\"",
      "90 DISPEL"
    ].join("\n"),

    OMEN: [
      "10 SCRUB",
      "20 OFFERING \"THE CUP IS EMPTY.\", \"SHE COUNTS THE KNIVES.\", \"A DOOR OPENS IN THE WALL.\", \"NOTHING ANSWERS. THAT IS AN ANSWER.\"",
      "30 CHANT \"THREE OMENS. DO NOT BLINK.\"",
      "40 CURSE I = 1 TO 3",
      "50 TAKE A$",
      "60 CHANT I; \". \"; A$",
      "70 BREAK",
      "80 CHANT \"GO HOME.\"",
      "90 DISPEL"
    ].join("\n"),

    CIRCLES: [
      "10 SCRUB",
      "20 COLOR 10, 0",
      "30 CURSE R = 2 TO 10 STEP 2",
      "40 CIRCLE 20, 12, R",
      "50 TONE 200 + R * 40, 20",
      "60 BREAK",
      "70 COLOR 11, 0",
      "80 LINE 0, 12, 39, 12",
      "90 LINE 20, 0, 20, 23",
      "100 AT 0, 23",
      "110 CHANT \"THERE. ART.\";",
      "120 DISPEL"
    ].join("\n"),

    MINIONS: [
      "10 SCRUB",
      "20 AT 0, 0",
      "30 CHANT \"TWO OF THEM. ESC STOPS IT.\";",
      "40 CONJURE A = MINION(\"👻\", 3, 6, 30)",
      "50 CONJURE B = MINION(\"🦇\", 30, 16, 30)",
      "60 SEND A, 10, 4",
      "70 SEND B, -8, -3",
      "80 WATCH HIT",
      "90 MARK LOOP",
      "100 IF (COL(A) <= 1 AND VX(A) < 0) OR (COL(A) >= 36 AND VX(A) > 0) THEN SEND A, -VX(A), VY(A)",
      "110 IF (ROW(A) <= 2 AND VY(A) < 0) OR (ROW(A) >= 21 AND VY(A) > 0) THEN SEND A, VX(A), -VY(A)",
      "120 IF (COL(B) <= 1 AND VX(B) < 0) OR (COL(B) >= 36 AND VX(B) > 0) THEN SEND B, -VX(B), VY(B)",
      "130 IF (ROW(B) <= 2 AND VY(B) < 0) OR (ROW(B) >= 21 AND VY(B) > 0) THEN SEND B, VX(B), -VY(B)",
      "140 FREEZE 20",
      "150 FLYTO LOOP",
      "160 MARK HIT",
      "170 SEND HIT, -VX(HIT), -VY(HIT)",
      "180 SEND OTHER, -VX(OTHER), -VY(OTHER)",
      "190 TONE 480, 20",
      "200 BANISH"
    ].join("\n"),

    KEYS: [
      "10 SCRUB",
      "20 AT 0, 0",
      "30 CHANT \"PRESS KEYS. Q LEAVES.\";",
      "40 MARK LOOP",
      "50 K$ = LISTEN$()",
      "60 IF K$ = \"Q\" OR K$ = \"q\" THEN DISPEL",
      "70 IF K$ <> \"\" THEN AT 2, 2 : CHANT K$; \"   \";",
      "80 FREEZE 20",
      "90 FLYTO LOOP"
    ].join("\n")
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
