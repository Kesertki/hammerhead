# <adf-button>

The `<adf-button>` web component is used to create a customizable button. It supports various styles and states.

## Usage

```html
<adf-button>Click Me</adf-button>
<adf-button disabled>Disabled</adf-button>
<adf-button type="submit">Submit</adf-button>
```

## Attributes

- `disabled`: Disables the button if present.
- `type`: Specifies the type of button. Default is `button`.

## Slots

- Default slot: The content of the button.

## Styling

The component includes the following custom CSS properties:

- `--adf-button-padding`: Padding inside the button
- `--adf-button-radius`: Border radius
- `--adf-button-bg-color`: Background color
- `--adf-button-text-color`: Text color

Example:

```css
adf-button {
  --adf-button-padding: 0.5rem 1rem;
  --adf-button-radius: 4px;
  --adf-button-bg-color: #007bff;
  --adf-button-text-color: #fff;
}
```

## Example Use Cases

- Form submission
- Action triggers
- Navigation buttons
- Any interactive element
