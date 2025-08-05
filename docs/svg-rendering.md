# SVG Detection and Rendering

This feature automatically detects SVG content in model responses and user messages, then renders them as actual images instead of displaying them as text.

## How it works

### 1. SVG Detection

The system detects SVG content in two formats:

- **Direct SVG tags**: `<svg>...</svg>` directly in the text
- **SVG in code blocks**: SVG wrapped in markdown code blocks with `xml` or `svg` language tags

```markdown
```xml
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="white" />
</svg>
```

```

### 2. Security

For security, the system:

- **Validates** SVG content to ensure it doesn't contain dangerous elements
- **Sanitizes** SVG by removing script tags and event handlers  
- **Prevents** execution of JavaScript within SVG content
- **Shows an error** if SVG content is deemed unsafe

### 3. Rendering

Safe SVG content is rendered as:

- **Visual images** instead of text code
- **Centered** in a bordered container
- **Responsive** with max dimensions to fit the chat
- **Styled** with light/dark mode support

## Components

### `MessageMarkdownWithSVG`
Enhanced version of `MessageMarkdown` that handles mixed text and SVG content.

### `SVGRenderer`
Dedicated component for safely rendering SVG content with security validation.

### `svgUtils`
Utility functions for:
- `detectSVGContent()` - Find SVG in text
- `splitTextWithSVG()` - Split text into text/SVG parts
- `isSafeSVG()` - Validate SVG safety
- `sanitizeSVG()` - Remove dangerous elements

## Usage

The feature works automatically for both:
- **Model responses** - LLM-generated SVG code is rendered as images
- **User messages** - Users can paste SVG code and see it rendered
- **Thought bubbles** - SVG in model reasoning is also rendered

## Example

When a model responds with:

```

Here's a simple duck SVG:

```xml
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="white" />
  <circle cx="60" cy="45" r="15" fill="black" />
  <circle cx="55" cy="55" r="5" fill="black" />
</svg>
```

The result would be beautiful!

```

The user will see the text explanation along with the actual rendered SVG image, making it much easier to visualize the generated graphics.
