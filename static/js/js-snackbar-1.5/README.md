# js-snackbar

## What is a Snackbar?

According to [Material Design](https://material.io/design/components/snackbars.html) a Snackbar or Toast provides "brief messages about app processes at the bottom of the screen." 

Generally, they should not have an icon associated with it and should be only one line on most devices.

While this version of a Snackbar follows the Material Design semantics closely, it strays in several major ways.

1. You can send multiple snackbars to a user at a time, as opposed to a single Snackbar at a time. 
2. The Snackbar appears in the bottom right corner, as opposed to the bottom left or bottom center.

## Basic Usage

Simply call `Snackbar()` to create the a notification message with default options, or pass an `options` object that includes some of the properties below in [Options](#options).

## Options

To customize a Snackbar, pass the function a JS object with any of the following properties. All properties are optional.

| Property    | typeof               | Default Value   | Notes |
| ----------- | -------------------- | --------------- | ----- |
| message     | `string`             | `"Operation performed successfully."` ||
| dismissible | `boolean`            | `true`          ||
| timeout     | `number` or `boolean`| `5000`          | Integer represents milliseconds. To specify no timeout, set the value to `false` or any number less than or equal to `0`|
| status      | `string`             |                 | Possible statuses include "success", "green", "warning", "alert", "orange", "danger", "error", "red." All other values will default to the blue "info" status|
| actions     | `array`              | `[]`            | See [Actions](#actions)|
| fixed       | `boolean`            | `false`         | `true` indicates a `positioning:fixed;` be added to the container|
| position    | `string`             | `"br"`          | Possible values are `"br"`, `"tr"`, `"tc"`, `"tm"`, `"bc"`, `"bm"`, `"tl"`, or `"bl"` |
| container   | `DOMNode` or `string`| `document.body` | If a string is provided, the string is passed to `querySelector` to find the container|
| width       | `string`             |                 | Any valid CSS value for `width` |
| speed       | `string` or `number` |                 | Any valid CSS value for `transition-duration` or a duration in milliseconds |
| icon        | `string`             |                 | `"exclamation"`, `"danger"`, `"warn"`, `"question"`, `"question-mark"`, `"info"`, `"add"`, `"plus"`, or any single character. Longer strings will be concatenated |

### Actions

Actions should be an array of objects matching the format

```ts
{
    text: string;
    function?: () => void;
    dismiss?: boolean;
}
```

At minimum, an action must have a text field, which will simply create a dismiss button with custom text. Alternatively, you can specify a `function` property which defines a custom function to be run once the action is clicked. This can be anything and is passed no parameters. If function is defined but you still want the action click to dismiss the snackbar, then you can specify `dismiss = true` to indicate that, once your method has run to completion, then the action will be automatically dismissed.
