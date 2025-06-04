# <adf-input>

The `<adf-input>` web component is used to create a customizable input field. It supports various types of inputs such as text, email, password, etc.

## Usage

```html
<adf-input type="text" placeholder="Enter your name"></adf-input>
<adf-input type="email" placeholder="Enter your email"></adf-input>
<adf-input type="password" placeholder="Enter your password"></adf-input>
```

## Attributes

- `type`: Specifies the type of input. Default is `text`.
- `placeholder`: Placeholder text for the input field.
- `disabled`: Disables the input field if present.

## Styling

The component includes the following custom CSS properties:

- `--adf-input-padding`: Padding inside the input field
- `--adf-input-radius`: Border radius
- `--adf-input-border`: Border style

Example:

```css
adf-input {
  --adf-input-padding: 0.5rem;
  --adf-input-radius: 4px;
  --adf-input-border: 1px solid #ccc;
}
```

## Example Use Cases

- Login form fields
- Signup form fields
- Search input
- Any form input field
