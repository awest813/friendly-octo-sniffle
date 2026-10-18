# Changelog

## 0.11.0

- **Tonight's Specials:** from wave 3, about half the waves get a random twist: Happy Hour, Burger
  Night, Salad Bar, Deluxe Day, Early Birds, School Trip, Quiet Night or Big Spenders. The shop
  previews the next one, it's stamped across the room when the doors open, and the hint line
  explains it. Never on the finale or themed waves, never twice in a row.
- **Music variety:** two gameplay grooves alternate by wave, the finale and Closing Time have their
  own tracks, and every loop alternates two melodies. CALM MUSIC from the shop now actually plays
  calm music.
- **New sounds:** a special's "ta-da", PERFECT and CLUTCH stings, a fanfare when the diner is saved
  and a "wah-wah" when the run ends.

## 0.10.1

- **Power-up rarity is real now:** drafts are weighted Common 5 : Rare 3 : Epic 2 (about 1 draft in
  4 shows an Epic), and the rarity label is colour-coded. Before, every card was equally likely.
- Streak call-outs keep coming on long runs: 3, 5, 10, 15, 20, then every 10.
- The shop warns when the next wave is the finale.
- Beans' card says what it does: guests *in line* lose patience slower.

## 0.10.0

- **Difficulty is now run length:** Easy saves the diner after 8 waves, Medium after 10 and Hard
  after 12. The last wave is billed as the FINALE. Easy keeps the old Relaxed breathing room; Hard
  is a little gentler per wave than Frantic was (×0.9 patience), since the night is longer.
- **Four new waves:** Night Owls (rusher crowd), Bus Tour (granny tour groups of 3), Critics Night
  (3 VIPs) and Midnight Rush (pairs, VIPs and rushers at once). Drafts now also come before
  waves 9 and 11. Closing Time starts no gentler than your finale.
- HUD, shop, game over and high scores show the run's goal; old saved settings and scores move
  over to the new names.
- Food patience ×2.05 (was ×1.9) after soak runs showed every loss came from guests waiting for food.
- **AI cook fixes** (solo play and the demo): the cook could idle on a ticket it wrongly thought it
  had sent when the Server served a more impatient guest first, and it never fetched a part stashed
  on the spare assembly counter. Both caused guests to starve for no visible reason.
- Pause menu shows the difficulty and how far into the night you are ("MEDIUM - WAVE 4 OF 10").
- Smoother late curve: Full House sends a pair every 18 s (was 16 s); Night Owls has fewer rushers.
- GitHub Pages: the deploy checks Pages is enabled with a clear error, and shared links get a
  preview image.
- Fixed overlaps on the Settings difficulty row, the wave-start pop-ups and the game-over pet icons.

## 0.9.0 — release candidate

First public build: a full run from the title screen to the run-over screen.

- **The game:** two-player couch co-op diner, one Cook and one Server. 8 waves to save the diner,
  then the endless Closing Time. Burgers, salads and deluxes; fire from wave 5.
- **Controls:** two gamepads first, keyboard fallback, rumble, auto-pause on window blur or pad
  disconnect.
- **Solo play:** an AI teammate (Chill / Normal / Sharp) takes the empty role.
- **Learning:** How to Play pages, button prompts over whatever you face, coach arrows for the first
  two waves, prep time at the start of each wave.
- **Variety:** six kinds of guest, 13 power-ups drafted before waves 3, 5 and 7, a between-wave
  shop, and six adoptable diner pets (Adoption Day every 5th wave).
- **Rewards:** streaks, PERFECT and CLUTCH serves, chain bonuses, rhythm chopping, perfect sears,
  star-rated waves and local high scores. No purchases, ads or daily-login hooks.
- **Settings:** difficulty (Relaxed / Normal / Frantic), prompts, volumes, shake, rumble, AI skill,
  fullscreen.

Balance and stability come from bot-vs-bot soak runs; it still needs playtesting with real pads.
See [docs/GDD.md](docs/GDD.md) for the design and balance notes.
