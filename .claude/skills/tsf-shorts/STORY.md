# Writing a TSF short for TikTok

Audience: English speakers in the US and UK who scroll fast. Goal: watched to the end (and again), shared, commented. TikTok's Creator Rewards pay only for videos longer than one minute, so every episode is **61-75 seconds**.

## Length

A calm, clear narrator says about 2.6 words a second. **165-190 words** gives 63-73 s. After recording, `words.py` reports the real length: under 61 s means adding a line, over 75 s means cutting one.

## Shape

| time | part | job |
|---|---|---|
| 0-3 s | Hook | The most surprising true fact in one short sentence. No "hi", no "in this video". |
| 3-15 s | Set-up | Who, where, when, what they wanted. Concrete and quick. |
| 15-45 s | Escalation | Each beat makes it worse, weirder or bigger. A small turn every 7-10 s keeps people watching ("Perfect plan." / "It wasn't."). |
| 45-60 s | Payoff | The result, with the best number or the best quote. |
| last 3-6 s | Button | A short line that lands the joke or the irony and leads back into the first line, so the loop feels natural. |

## Sentences

- Short: most under 12 words. One idea per sentence (each one becomes a shot).
- Concrete nouns, names, numbers, places. "Twenty thousand emus" beats "a lot of birds".
- Put the punch at the end of the sentence, or alone: "And lost."
- Spoken rhythm: vary long and short. Read it out loud once.
- Numbers: write them the way they should be said. "1932" is read "nineteen thirty-two"; for money say "125 million dollars".
- Quotes only if the sources really have them; say who said them.
- No filler ("basically", "so yeah", "let's dive in"), no calls to follow in the middle.
- Humour comes from the facts and the contrast, not from mocking people. Tragedies keep a respectful tone.

## Facts

- Use at least two independent sources for every number, date and name.
- If sources disagree, use the safe version or say "about".
- Keep a short list of the sources in the chat when you show the script.

## Recording tips for the user (ElevenLabs)

- Voice: pick one from the Voice Library, or create one in Voice Design with this prompt (also in `VOICE_PROMPT.txt`):
  "A warm, confident American male narrator in his early 30s, clear and expressive storytelling voice with a slightly playful tone, like a documentary host who loves weird history. Studio quality, close microphone, no background noise, medium pace."
- Stability about 45-55 %, similarity about 75 %, style 0-20 %, speed 1.0-1.1.
- Generate the whole script in one go (same voice energy), listen, regenerate only bad sentences if needed, then export one mp3.
- Save it as `episodes/<name>/voice.mp3`.

## TikTok description

One or two lines that add curiosity (not a summary), a question that invites comments, then 3-5 hashtags, for example:
`The army had machine guns. The emus had legs. Who would you bet on? #history #didyouknow #animation #australia #storytime`
