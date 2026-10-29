# JavaScript Mini Projects

Fourteen small browser apps written in plain HTML, CSS and JavaScript, with no framework and no build step. A gallery page (`index.html`) links to all of them, and a headless-browser test suite checks that every app loads cleanly and that the interactive ones behave correctly.

## Apps

| App | What it does |
|---|---|
| [Bill Split](bill-split/) | Splits a bill and tip between a number of people. |
| [Blobmaker](blobmaker/) | Shapes a blob with sliders and copies the CSS `border-radius`. |
| [Card Hover Effect](card-hover-effect/) | A card that flips on hover, in pure CSS. |
| [Copy to Clipboard](copy-to-clipboard/) | Copies text with the Clipboard API and confirms it. |
| [Currency Converter](currency-converter/) | Converts between currencies using fixed sample rates; you can add your own. |
| [Dice Game](dice-game/) | Two players roll dice and the game keeps score. |
| [Digital Clock](digital-clock/) | A live 12-hour clock. |
| [Guess the Number](guess-the-number/) | Guess a number from 1 to 100 with higher/lower hints. |
| [Infinite Scroll](infinite-scroll/) | Loads more posts from a public API ([JSONPlaceholder](https://jsonplaceholder.typicode.com/)) as you scroll. |
| [Multi Typing](multi-typing/) | A typewriter effect that cycles through words. |
| [Password Validation](password-validation/) | Shows which password rules are met as you type. |
| [Product Slider](product-slider/) | A landing page with a scrollable product carousel. |
| [String Transformers](string-transformers/) | Converts a sentence to camel, Pascal, snake and kebab case. |
| [To-do List](todo-list/) | Add, complete and delete tasks, saved in your browser's `localStorage`. |

## Running locally

Several apps load their script as an ES module (`<script type="module">`), and browsers refuse to load modules from `file://`. Opening `index.html` straight from disk therefore leaves some apps blank, so serve the folder instead:

```bash
npm start            # serves this folder on http://127.0.0.1:8080/
PORT=3000 npm start  # or pick another port
```

`npm start` uses a small static server in `tests/serve.mjs` that needs only Node.js (18 or later), so you can run it before `npm install`. Any other static server works too, for example `python3 -m http.server`.

Some pages load web fonts or icons from Google Fonts and cdnjs, and Infinite Scroll fetches its posts from JSONPlaceholder, so those parts need an internet connection.

## Tests

The tests drive the apps in headless Chromium through [Playwright](https://playwright.dev/).

```bash
npm install
npx playwright install chromium   # first time only
npm test
```

`npm test` runs two scripts:

- **Smoke test** (`tests/smoke.mjs`): opens the gallery and every app, and fails on uncaught errors, console errors, a reference to a local file that doesn't exist, or a page that scrolls sideways on a 390px or 320px wide phone screen. Failures of external resources (fonts, CDNs, the posts API) are listed but don't fail the run, so it also works offline. It also checks that the gallery links to every app.
- **Interaction checks** (`tests/interactions.mjs`): use the apps the way a person would and check the result. Examples: Guess the Number is played to the end with a binary search, Bill Split's totals are checked, Infinite Scroll is fed stubbed posts and a failing API, and the To-do List is checked across a page reload.

To run either one for selected apps:

```bash
npm run test:smoke -- dice-game todo-list
npm run test:interactions -- todo-list
```

If you already have a Chromium build, you can point the tests at it instead of installing one: `CHROMIUM_PATH=/path/to/chrome npm test`.

## What changed in this version

The apps began as earlier small exercises. This version reworks them into a tested collection:

- **Bug fixes.**
  - Guess the Number no longer records empty guesses as `NaN` or prints the answer to the console.
  - Currency Converter lost a "Custom" option that converted to nothing, and now rejects invalid currency codes and rates.
  - String Transformers no longer produces `undefined` for repeated spaces, and snake/kebab case are lowercase.
  - Password Validation now updates on paste and autofill.
  - Product Slider still scrolls by the right amount after a window resize.
  - Bill Split, Blobmaker, Multi Typing and Infinite Scroll referenced files that weren't there.
- **Phone layouts.** Eight apps were wider than a phone screen (up to 556px on a 390px phone). Bill Split, Copy to Clipboard and String Transformers had full-width fields whose padding pushed them past the edge; Blobmaker, Dice Game and Guess the Number had fixed widths; Digital Clock's time was too large; Product Slider's menu squeezed beside the logo. Each now fits at 390px and 320px.
- **Modern APIs.** The copy buttons use the Clipboard API instead of the deprecated `document.execCommand('copy')`.
- **Finished app.** The To-do List had markup but an empty script. It now adds, completes and deletes tasks and keeps them in `localStorage`.
- **Images.** Photos with no known source were removed. Product Slider now uses SVG placeholders and a CSS gradient banner, and Digital Clock uses a CSS gradient background.
- **Tests and tooling.** The smoke test, interaction checks, static server and gallery page are new.

## License

MIT. See [LICENSE](LICENSE).
