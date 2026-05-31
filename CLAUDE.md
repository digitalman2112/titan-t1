# titan-t1 — Claude guidance

## Site settings

Global settings live in `_data/settings.yaml` and are available in templates as `site.data.settings`.

### `favorited_exercises`

A list of exercise codes (e.g. `EX-001`) that appear on the homepage as a card grid. The homepage shows only these exercises and links to the full exercises index for everything else. To feature an exercise on the homepage, add its code here.

```yaml
favorited_exercises:
  - EX-001
  - EX-002
```

## Exercise markdown conventions

### Photos

Photos must be a proper YAML list with `- ` prefixes and a leading `/` on each path:

```yaml
photos:
  - /assets/images/exercises/titan-t1-2.png
```

A plain string (missing `- `) will appear to work on the exercise detail page but will break on the homepage and exercises index, which use `exercise.photos[0]`.



Exercise files live in `_exercises/`. Each file has YAML front matter listing the exercise's `cables` and `accessories` by code, and the body contains setup and instruction sections written in markdown.

### Equipment color coding

Use inline HTML spans throughout exercise body content to color-code references to physical equipment. This applies to every section: Setup, instructions, After Completing, and Precautions.

| Class | Color | Use for |
|---|---|---|
| `ref-cable` | Blue | Cables and their codes (e.g. `C1-L`, `CBL-001`) |
| `ref-accessory` | Amber | Accessories and their codes (e.g. `S1-L`, `ACC-001`, "footplate", "exercise handle") |
| `ref-hook` | Green | Hook references (e.g. `H-3`, "hooks") |

**Apply to both the item name and its code when both appear:**
```html
Insert the <span class="ref-cable">leg press cable</span> <span class="ref-cable">C1-L</span> into hole 13-L.
```

**Apply to the name alone when no code is given in that sentence:**
```html
Unlock both <span class="ref-accessory">exercise handles</span> simultaneously.
```

Hole numbers (13-L, 3-R, etc.) are not color-coded — bold them with `**` if emphasis is needed.

The color tokens are defined for both light and dark themes in `assets/css/main.scss`. The Required Equipment section in `_layouts/exercise.html` already applies these classes automatically via the template.
