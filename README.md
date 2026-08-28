# [Bonnibel's carrion userscripts](https://bbbonnibel.github.io/carrion-userscripts)

These are small userscripts made for [carrion.chat](https://carrion.chat/) to improve quality of life.

Each userscript focuses on doing one specific thing, so you can install only the modifications you want. You will need to install a userscript manager extension like [Tampermonkey](https://www.tampermonkey.net/) in order to use them.

- **Contact:** These userscripts are maintained by ***Bonnibel*** and ***Spider-Gwen***. Message us if you have any issues!
- **Nerd stuff:** [View source on GitHub](https://github.com/bbbonnibel/carrion-userscripts)

## New features

_These scripts introduce new features to your carrion experience._

### [Autocomplete](https://bbbonnibel.github.io/carrion-userscripts/script/autocomplete/autocomplete.user.js) (Beta)

Your chat messages now have an optional autocomplete for emojis, commands, and mentions.

The autocomplete automatically pops up as you start writing a `@mention` or a `/command`. It will also offer autocomplete for emojis by writing `:shortcodes:`, such as `:heart:`. It won't actually modify your message unless you tell it to.

⚠️ Autocomplete by pressing **Tab**, or by picking the option. **Enter won't work**, because chat responds to that key first by sending your message.

Coming soon:

- Autocomplete for commands needs a bit more work.
- Autocomplete for rooms.

### [Character Pins](https://bbbonnibel.github.io/carrion-userscripts/script/character-pins/character-pins.user.js)

Pin characters to the top of your dashboard. No matter what sort order you choose, those characters will appear before any others.

- Click a character's pin button to pin them to start.
- Right-click that pin button to pin them to the end.

### [Chat Unread Indicator](https://bbbonnibel.github.io/carrion-userscripts/script/chat-unread-indicator/chat-unread-indicator.user.js) (Beta)

Introduces an unread indicator to your chat's sidebar, which will tell you if there's new messages out of view and whether any of them are mentions.

Currently in beta testing.

## Quality of life

_These scripts focus on positive adjustments to existing features._

### [Dashboard Revised](https://bbbonnibel.github.io/carrion-userscripts/script/dashboard-revised/dashboard-revised.user.js)

This script revises exclusively the dashboard page.

- Adds the option of a compact view.
- Notification center now has a Focus button, which filters the character grid down to only those characters with notifications.

### [Compact Character Controls](https://bbbonnibel.github.io/carrion-userscripts/script/compact-character-controls/compact-character-controls.user.js)

This script introduces a compact menu [&nbsp;⋮&nbsp;] to the dashboard and character pages (yours and others). Most lesser-used options on those pages get moved into that menu.

On your own character pages, this script adds a new “chat as this character” button to the top of the compact menu.

Exact changes:

- *Dashboard:* Tucks away the “Import from F-List” button.
- *Character page (yours):* Tucks away “Overwrite from F-List” and “Import Gallery”, and adds “Chat as this character” to the top of the list.
- *Character page (others):* Tucks away the mute/block/report buttons.

### [Kink Switches](https://bbbonnibel.github.io/carrion-userscripts/script/kink-switches/kink-switches.user.js)

In the character's kink editor, replace the kink dropdowns with a set of Fave/Yes/Maybe/No buttons. To clear your setting, click the kink that's active.

This script is not color-blind friendly.

### [Kink Contexts Revised](https://bbbonnibel.github.io/carrion-userscripts/script/kink-contexts-revised/kink-contexts-revised.user.js)

Each kink gets a little cog icon beside it that can force contexts to show, even in “never show” mode.

The cog icon will have an indicator telling you if there's hidden selected contexts.

### [Shiny Character Page Border](https://bbbonnibel.github.io/carrion-userscripts/script/character-border/character-border.user.js)

Character pages will now have their top border show the character's color.

This is like what happens on the search and dashboard pages, except for those it's the left edge.

### [Go to Trusted Images](https://bbbonnibel.github.io/carrion-userscripts/script/go-to-trusted-images/go-to-trusted-images.user.js)

Carrion intercepts most outgoing links with a “You are now leaving carrion” page. This script makes that page auto-forward if two conditions are met: (1) the link is on carrion's list of trusted image domains, *and* (2) it looks like an image link. Any other kinds of links, or images on any other kind of domain, are not auto-forwarded.

This implements a feature request we consider reasonable in a way that's opt-in. While this technically bypasses a security measure, our reasoning is this: this script is vulnerable if a trusted image host can host malicious files that look like images. If that is true, we should either ban that image host or ban that user. Someone has _already_ clicked on that link, and they're not going to read the URL a second time before they hit “continue”.
