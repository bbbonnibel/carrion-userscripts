# Bonnibel's carrion userscripts

These are small userscripts made for [carrion.chat](https://carrion.chat/) to improve quality of life.

Each userscript (although there's just one right now) is small, so you can choose only the behaviour you want.

[View source on GitHub](https://github.com/bbbonnibel/carrion-userscripts) (for nerds)

## What's a userscript? How do I use one?

Userscripts are small JavaScript scripts you can run to customise a website.

The scripts below expect you're using a browser extension like [Tampermonkey](https://www.tampermonkey.net/). There's a few different userscript extensions; this is the one I'd recommend.

Think of userscripts as not quite browser extensions, more like little lightweight extensions that work on particular webpages. The below scripts only ever run inside the carrion domain.

##  Quality of life

### [Dashboard Revised](https://bbbonnibel.github.io/carrion-userscripts/script/dashboard-revised/dashboard-revised.user.js)

This script revises exclusively the dashboard page.

- Adds the option of a compact view.
- Notification center now has a Focus button, which filters the character grid down to only those characters with notifications.

### [Kink switches](https://bbbonnibel.github.io/carrion-userscripts/script/kink-switches/kink-switches.user.js)

- In the character's kink editor, replace the kink dropdowns with a set of Fave/Yes/Maybe/No buttons.
- You click one of those buttons to set your preference. Click on the current preference to unset it.
- Just like the current editor, kinks you modified this session show up in another color.
- This script is not color-blind friendly.
- ⚠️ Due to a performance issue in the character editor, your editor might pause for 1-2 seconds after you click a button. That's not caused by this script. That's part of the character editor, and would equally occur if you picked something from a dropdown. It's just this script highlights that performance issue. It's been reported and hopefully will be fixed soon.
