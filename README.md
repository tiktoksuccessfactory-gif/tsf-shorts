# TSF Shorts

**Autor: Kevin Hopek, [TikTok Success Factory](https://tiktoksuccessfactory.pl)**

Nasz własny system do pionowych animowanych shortów na TikToka: ręcznie rysowane ludziki i zwierzaki w świecie 3D, z konturami, rozmyciem tła, muzyką i efektami, wszystko zgrane co do słowa z Twoim lektorem. Filmy po angielsku, 61-75 sekund, pod Creator Rewards.

Cały kod jest nasz. Silnik korzysta tylko ze zwykłych darmowych bibliotek open source, które instalują się same (three.js, Playwright, ffmpeg, faster-whisper).

## Co trzeba mieć (jednorazowo)

1. **Node.js LTS** ze strony nodejs.org (instalator, wszystko domyślnie).
2. **Google Chrome** (albo Edge, który i tak jest w Windowsie).
3. **Python 3** ze strony python.org. Przy instalacji zaznacz **"Add python.exe to PATH"**. Potrzebny tylko do odczytania czasów słów z nagrania.
4. **Claude Code**, żeby Claude pisał odcinki za Ciebie.

Folder `TSF_Shorts` wypakuj gdzieś w `C:\Users\<Ty>\`, np. `C:\Users\Kevin\TSF_Shorts`. Nie na dysk zewnętrzny (wtedy Windows potrafi blokować dostęp).

## Pliki do klikania

| plik | co robi |
|---|---|
| `RENDER.bat` | robi gotowy film. Za pierwszym razem sam instaluje paczki. Pyta o nazwę odcinka i jakość: 1 = final 1080x1920, 2 = szybki podgląd, 3 = tylko dźwięk i napisy od nowa |
| `PREVIEW.bat` | odpala podgląd odcinka na żywo w przeglądarce (spacja = play/pauza, strzałki = klatka) |
| `WORDS.bat` | czyta Twoje nagranie i zapisuje, kiedy pada każde słowo (`words.json`) |

Gotowe filmy lądują w `out\<nazwa>\`: `<nazwa>.mp4` z napisami i `<nazwa>_no_captions.mp4` bez.

## Jak powstaje odcinek (z Claude Code)

1. Otwórz folder `TSF_Shorts` w Claude Code i napisz np. *"Zróbmy nowy odcinek TSF o Pig War"* albo *"daj 3 tematy"*.
2. Claude sprawdza fakty i pisze scenariusz (`episodes\<nazwa>\SCRIPT.txt`). Poprawiacie, aż Ci pasuje.
3. Nagrywasz scenariusz w ElevenLabs (głos i ustawienia niżej) i zapisujesz jako `episodes\<nazwa>\voice.mp3`.
4. Piszesz Claude'owi, że głos jest. On odpala czasy słów, układa ujęcia, sprawdza klatki i poprawia kadry.
5. Na koniec `RENDER.bat` (albo Claude sam odpala render) i masz gotowy film plus opis i hashtagi.

## Głos lektora (ElevenLabs)

Lektora wybierasz z Voice Library albo tworzysz własnego w **Voice Design**. Do Voice Design wklej ten prompt (jest też w pliku `VOICE_PROMPT.txt`):

> A warm, confident American male narrator in his early 30s, clear and expressive storytelling voice with a slightly playful tone, like a documentary host who loves weird history. Studio quality, close microphone, no background noise, medium pace.

Ustawienia przy generowaniu narracji: stability ok. 50%, similarity ok. 75%, style 0-20%, speed 1.0-1.1. Cały scenariusz generuj naraz, żeby głos miał tę samą energię od początku do końca, potem pobierz mp3.

## Odcinek przykładowy: Great Emu War

W `episodes\emu_war` jest kompletny odcinek. Ma **tymczasowe** czasy słów, więc działa od razu, ale bez lektora.
Żeby zrobić go na serio:
1. Nagraj tekst z `episodes\emu_war\SCRIPT.txt` w ElevenLabs i zapisz jako `episodes\emu_war\voice.mp3`.
2. Odpal `WORDS.bat` i wpisz `emu_war` (podmieni tymczasowe czasy na prawdziwe).
3. Odpal `RENDER.bat`, wpisz `emu_war`, wybierz `1`.

Ujęcia są przypięte do fraz z tekstu, więc same dopasują się do Twojego tempa mówienia.

## Jak to jest zbudowane

```
TSF_Shorts\
  RENDER.bat  PREVIEW.bat  WORDS.bat
  engine\        silnik: postacie, zwierzęta, świat, efekty, napisy na ekranie, wygląd
  scripts\       render, dźwięk (muzyka i efekty generowane od zera), napisy, czasy słów
  player\        strony, które rysują film w przeglądarce
  episodes\      jeden folder = jeden odcinek (emu_war = przykład, _template = start nowego)
  out\           gotowe filmy
  .claude\skills\tsf-shorts\   instrukcje dla Claude'a (SKILL, API, STORY, TOPICS)
```

## Jak coś nie działa

- **"Could not start Chrome or Edge"**: zainstaluj Google Chrome i odpal jeszcze raz.
- **Render bardzo wolny**: w okienku na początku jest linijka `graphics: ...`. Jeśli jest tam "SwiftShader", przeglądarka nie używa karty graficznej: zaktualizuj sterowniki karty i Chrome.
- **Czarne klatki albo błędy grafiki**: odpal w okienku cmd w folderze projektu `set TSF_GL=swiftshader` a potem `node scripts\make.mjs <nazwa>` (wolniej, ale zawsze działa).
- **"Odmowa dostępu"**: folder leży w złym miejscu, przenieś go do `C:\Users\<Ty>\`.
- **npm install nie wychodzi**: zainstaluj Node w wersji LTS (nie "Current") i odpal `RENDER.bat` jeszcze raz.
- **WORDS.bat: brak Pythona**: zainstaluj Pythona z python.org z zaznaczonym "Add python.exe to PATH".
- **Lektor dłuższy niż film**: odcinek kończy się na ostatnim słowie z `words.json`; po nagraniu zawsze odpal `WORDS.bat`.

## Licencja

Możesz używać TSF Shorts do robienia własnych filmów, także na kontach, na których zarabiasz. Gotowe filmy są Twoje.
Bez mojej pisemnej zgody nie wolno sprzedawać, odsprzedawać, dodawać do płatnych kursów ani publikować kopii tego projektu w innych miejscach. Pełne zasady: `LICENSE.txt`.

TSF Shorts © 2026 Kevin Hopek, TikTok Success Factory (tiktoksuccessfactory.pl)
