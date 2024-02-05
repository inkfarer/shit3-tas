# shit3 TAS

A tool-assisted speedrun for [shit3](https://stuffedwombat.itch.io/shit-3), a two-key 2D platformer.

**Be warned, this is *not good code* and it will likely remain so.** A lot of this logic is buggy, but it'll produce the
same run every time it is run, which is all it really needs to do.

## what do i do with these files?

1. Clone this repository somewhere: `git clone https://github.com/inkfarer/shit3-tas.git`
2. [Download the game,](https://stuffedwombat.itch.io/shit-3) it's free. If in doubt, download the Linux version, we'll 
   make it work on any platform in a moment.
3. Locate the file `package.nw` in the downloaded game files and copy it to where you cloned this repository.
4. Extract the package file to the project directory. On Linux or macOS, run `tar -xvf package.nw`.
   Other archive utilities such as [7-zip](https://www.7-zip.org/) may work, but are untested.
5. Apply patches to the runtime script: `git apply c2runtime.patch`
6. Open the `index-tas.html` file in a local web server. 
   [VSCode](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) supports this as a plugin, while
   [WebStorm](https://www.jetbrains.com/help/webstorm/editing-html-files.html#ws_html_preview_output_procedure) and other
   JetBrains editors support this by default. Opening the file directly in your browser will not work.

## what does this do, now?

- The game has been modified to update at a maximum of 60 times per second regardless of what refresh rate the user's
  display is set to
- Controls have been added to move forward or back in the game by one frame at a time
  - Press the "tick" and "rewind" buttons (T and ; respectively) at the top of the screen. 
  - Rewinding must be enabled before it may be used.
  - Rewinding tends to be wonky, but worked well enough to get the run done. Before calling your run of a level complete,
    confirm that the entire level can be run through by pressing the "restart layout" button (or the N key) and playing
    your entire movie from start to finish.
- Controls have been added to pause and unpause the game loop
  - Press the "pause" and "play" buttons at the top of the screen or use the P key
- A level selector has been added
  - Use the "layout" button located at the top of the screen.
- The ability to record inputs and play them back has been added
  - Each level's inputs are stored separately in the same file to make modifying these replays easier.
  - A TAS replay has been included with this repository in the `movie.js` file. Use the "clear inputs" button or modify
    this file's contents to reset to a clean slate.
  - Press "export inputs" to save a file to disk containing the recorded inputs.
  - Check the "Recording" checkbox and play through the game. Uncheck the "Recording" checkbox and check the "Play"
    checkbox to replay those recorded frames.
  - Press the "editor" button to view and modify the saved inputs.

## a few other notes

- The "add blanks" button adds blank frames (no keys pressed or depressed) to the replay of the current level. While
  playing back inputs for a level, the game will stop when it runs out of frames to play back. Use this button to add
  more frames to the replay.
- The "Trim movie" checkbox removes any frames from the replay that happen after the level is completed. Use it to trim
  the size of the replay file.
- The "save" and "load" buttons are remnants from an early proof of concept. They do what they say, but aren't needed
  for a TAS run.
