// AlphaLearn custom sounds
// ------------------------
// Put audio files (.mp3, .wav or .m4a) in the folders next to this file,
// then list them below. Paths are relative to this "sounds" folder.
// If a list is empty (or a file is missing), the built-in sound is used.
//
// One file is picked at random each time (never the same one twice in a row).
//
// Letter prompts don't need listing: name them by letter, e.g.
//   sounds/letters/G.mp3   (or G.wav / G.m4a)  ->  "Find the letter G!"
// A letter with its own file uses it. Otherwise the "prompt" recording below
// plays ("Find the letter...") and the computer voice says the letter.

window.ALPHALEARN_SOUNDS = {
  // Right answer. Example: ["correct/great-job.mp3", "correct/yay.wav"]
  correct: [],

  // Wrong answer. Example: ["wrong/fart1.mp3", "wrong/fart2.mp3"]
  wrong: ["wrong/fart1.mp3", "wrong/fart2.mp3", "wrong/fart3.mp3"],

  // Played once all 5 rounds are done. Example: ["finish/song.mp3"]
  finish: [],

  // Your "Find the letter..." recording. The computer voice then says the letter.
  prompt: "letters/LetterPrompt.m4a",

  // Plays when the hippo on the grown-up screen is tapped.
  help: "help/HippoHelp.m4a",

  // Theme song that loops quietly in the background the whole time.
  // Starts on the first tap/keypress (browsers block sound before that).
  // musicVolume: 0 = silent, 1 = full. It gets even quieter while the letter is spoken.
  music: "music/theme.mp3",
  musicVolume: 0.2,

  // Look for one-file-per-letter recordings (A.mp3 ... Z.mp3) in sounds/letters/.
  // Set to true once you've recorded some; false avoids "file not found" noise.
  letterPrompts: false
};
