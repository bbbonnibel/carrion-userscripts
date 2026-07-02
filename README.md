# Bonnibel's carrion userscripts

These are small userscripts made for [carrion.chat](https://carrion.chat/) to improve quality of life.

Each userscript is small, so you can install only the modifications you want. You will need to install a userscript manager extension like [Tampermonkey](https://www.tampermonkey.net/) in order to use them.

[View source on GitHub](https://github.com/bbbonnibel/carrion-userscripts) (for nerds)

## Quality of life

### [Dashboard Revised](https://bbbonnibel.github.io/carrion-userscripts/script/dashboard-revised/dashboard-revised.user.js)

This script revises exclusively the dashboard page.

- Adds the option of a compact view.
- Notification center now has a Focus button, which filters the character grid down to only those characters with notifications.

### [Compact Character Controls](https://bbbonnibel.github.io/carrion-userscripts/script/compact-character-controls/compact-character-controls.user.js)

This script moves some less-used character controls into context menus.

- **Dashboard:** Tucks away the “Import from F-List” button.
- **Character page (yours):** Tucks away “Overwrite from F-List” and “Import Gallery”.
- _Planned, later_ — **Character page (others):** Tuck away mute/block/report buttons.

### [Kink Switches](https://bbbonnibel.github.io/carrion-userscripts/script/kink-switches/kink-switches.user.js)

In the character's kink editor, replace the kink dropdowns with a set of Fave/Yes/Maybe/No buttons. To clear your setting, click the kink that's active.

This script is not color-blind friendly.

⚠️ Due to a performance issue in the character editor, your editor might pause for 1-2 seconds after you click a button. That's not caused by this script. That's part of the character editor, and would equally occur if you picked something from a dropdown. It's just this script highlights that performance issue. It's been reported and hopefully will be fixed soon.

### [Kink Contexts Revised](https://bbbonnibel.github.io/carrion-userscripts/script/kink-contexts-revised/kink-contexts-revised.user.js)

Each kink gets a little cog icon beside it that can force contexts to show, even in “never show” mode.

The cog icon will have an indicator telling you if there's hidden selected contexts.
