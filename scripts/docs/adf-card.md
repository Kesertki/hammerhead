# <adf-card>

The `<adf-card>` web component is a container element used to display grouped content inside a styled card. It supports slotted content for headers, body, and actions.

## Usage

```html
<adf-card>
  <h2 slot="header">Login</h2>
  <form slot="body">
    <label>
      Email
      <input type="email" />
    </label>
    <label>
      Password
      <input type="password" />
    </label>
  </form>
  <div slot="footer">
    <button>Submit</button>
  </div>
</adf-card>
```

## Slots

- `header`: Optional. Rendered at the top of the card.
- `body`: Main content area. Use this to place forms, text, etc.
- `footer`: Bottom area. Often used for buttons or links.

## Attributes

None required.

## Styling

The component includes the following custom CSS properties:

- `--adf-card-padding`: Padding inside the card
- `--adf-card-radius`: Border radius
- `--adf-card-shadow`: Box shadow

Example:

```css
adf-card {
  --adf-card-padding: 2rem;
  --adf-card-radius: 12px;
}
```

## Example Use Cases

- Login form
- Signup card
- Profile summary
- Confirmation dialogs
