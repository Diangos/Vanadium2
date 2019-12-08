# Vanadium2
Yet another form validator

Initialize with `vanadium.init(validtionObject, validationOptions)`

## Validation object properties
Despite being called an object, the validation object is actually an array of objects. Each object in the array is called and defines *a rule* that Vanadium will apply to one or more inputs (elements).

### A rule's properties 
 * **selector** - A CSS selector that Vanadium2 will use to find the inputs that the current rule will apply to. This property is mandatory if elements does not provide a list of elements.
 * **elements** - An element or list of elements to which Vanadium2 will apply the current rule. This is mandatory if a selector is not provided for the rule to be considered.
 * **validateOn** - A string that determines when Vanadium2 will validate the element(s). These are the same events as DOM Events with one exception (onDemand - which, like the name suggests, will not apply the Vanadium2 validation automatically; only when the user calls validate on an element with that rule or during the execution of the `validateAll()` function). Some examples of event types: 'blur', 'change', 'keyup'
 * **addMessages** - A boolean that determines if Vanadium2 should add error messages to the DOM. To add a custom error the `postValidationFunction` function can be used.
 * **preValidationFunction** - Like the name implies, it is a function that Vanadium2 will execute before running any other validation. Returning false will cancel the validation.
 * **validationFunction** - A custom function that validates the element according to arbitrary code. Can be asynchronous. Must return an array of or a strings. These will be the error messages that Vanadium will display for the element if `addMessage` is `true` or sent to the `postValidationFunction` function. 
 * **postValidationFunction** - Like the name implies, it is a function that Vanadium2 will execute after running every other validation. This function is used to dismiss or modify any errors on the element, cancel the validation outright (by deleting all errors) or displaying errors to a custom element.
 * **validators** - The array of validators. Described in more detail below. 
 
### Validators
 
The validators property contains all the validators that will be applied to the element.

All the validators described inside are cumulative\conjunct (**AND**), meaning that the input must pass every validator in order to be considered valid. Additionally, each element of the validators array can be an array itself and all the validators in the inner array are disjunct (**OR**) meaning that only one of the validations needs to pass for it to be considered valid

#### Inside a validator object

* **generate** - `'error'|'warning'` -  A string that represents whether Vanadium2 should consider this element invalid in case of validator failure or simply warn (display a warning instead of an error).
* **validator** - A string that represents the validation function to apply to the input. Vanadium has some built in functions but this could also be a custom function registered with vanadium via the `registerValidator()` method. Some examples of values are: `'number'` `'range'` `'required'` `'mustBeEqual'`
* **options** - The options for the validator. For example a `'mustBeEqual'` validation must specify the additional targets of the validation or for the `'number'` validation we can set whether to allow for scientific notation or not, all via the options object
* **errors** - Each validation can produce one or more types of errors/warnings (which can be consulted in the docs for each validator type). The errors object allows you to specify custom error messages for each error type the validator can output. The validator will use its default error strings for each validation unless this object provides a key of the same type as the validation type (ex. `'noScientific'`) and a string that is to be the error as value.

#### Validator example

```javascript
const validators = [
    [{
        generate: 'error',
        validator: 'number',
        options: {
            min: 0,
            max: 30,
            step: 1,
            noScientific: true,
            inclusiveMin: true,
            inclusiveMax: false
        },
        errors: {
            min: 'The value is not bigger than 0.'
        }
    }, {
        generate: 'error',
        validator: 'range',
        options: {
            openEnded: true,
            min: 0,
            max: 10,
            step: 1,
            noScientific: false,
            noSpaces: true
        }
    }], {
    generate: 'warning',
    validator: 'mustBeEqual',
    options: {
        targets: [
            '{{closest@.bibi}} .gigi',
            '{{parents@.lulu}} .fifi'
        ],
        equalityType: 'some'
    }
}];

console.log(validators);
```
This means that the element *must* be either numbers **OR** ranges (ex. 1-7 or ?-10) **AND** *should* (because of the `'warning'`) mustBeEqual (a little contradiction of terms) to one or more of the targets (more on the syntax there later - for now, you should know we call that a *tokenized string*).

#### Tokenized strings
Some validators allow you to reference other elements in relation to a selector or your element itself. In order to do that within the confines of strings, we use tokens that look something like this:

`{{closest@.addressGroup}}`

Tokens are defined by double brackets `{{...}}` (this can be changed, but this is the default) and their structure is two-part with the two parts separated by an `@`. The first part is the function to apply (`closest` in our example) and the second part represents how to apply it, just like a parameter for the function).

Tokenized strings can resolve to multiple elements so you should take care so that only the elements that you want are selected.