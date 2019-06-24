"use strict";

/**
 * Vanadium 2
 * Made by Merlas Tudor (Diangos)
 */

/**
 * A function to validate or register as validator
 * @name validationFunction
 * @param {*} value - the value to validate
 * @param {object} [options] - the options for the validation (ex. min, max, allowedCharacters...)
 * @param {object} [errorMessages] - an object with the same keys as the previous param (ex. min, max...) with strings as values

 */

/**
 * @typedef {Object} Validator
 * @prop {string} generate
 * @prop {string} validator
 * @prop {object} options
 * @prop {object} errors
 */

/**
 * @typedef {Object} ValidationRule
 * @prop {string} selector - The selector used to obtain all elements to apply event listeners to
 * @prop {HTMLElementList|HTMLElement} elements - The actual elements the validator will apply event listeners to
 * @prop {string} validateOn - The type of event the validator should bind to
 * @prop {boolean} validationOr - Determines if the validators are applied ANDed or ORed
 * @prop {boolean} addMessages - Determines whether to create DOM elements under the validated element and put the error or warning text in them
 * @prop {Validator[]} validators - An array of all the validators to apply with their individual options
 */


const validator = {
    _constants: {
        dataAttribute: 'data-validation-index',
        invalidMessage: 'The input is not valid.'
    },
    _rules: [],

    /**
     * Gets the rule for a given element if not supplied
     * @param element
     * @param {ValidationRule} rule
     * @returns {boolean|ValidationRule}
     * @private
     */
    _resolveRule: function (element, rule) {
        if (rule) {
            return rule;
        } else {
            const elementIndex = element.getAttribute(this._constants.dataAttribute);

            if (elementIndex) {
                return this._rules[elementIndex]
            } else {
                return false
            }
        }
    },

    /**
     * Gets the error message for the current error type. If none is found, the default message is used
     * @param {string} errorType - A string that determines what key to access on the errorMessages object
     * @param {object} errorMessages - An object with keys that represent the error type. Their value is the error message
     * @returns {string}
     * @private
     */
    _getError: function (errorType, errorMessages) {
        if (!errorType || !errorMessages || !errorMessages[errorType]) {
            return this._constants.invalidMessage;
        } else {
            return errorMessages[errorType];
        }
    },

    /**
     * Initializes the validator, adding eventListeners, classes and other stuff
     * @param {ValidationRule[]} rules
     */
    init: function (rules) {
        if (!rules) {
            return;
        }

        // TODO: copy element instead of reference since the external reference can change
        this._rules = rules;

        for (let i = 0; i < rules.length; i++) {
            let inputs;

            if (rules[i].selector) {
                inputs = document.querySelectorAll(rules[i].selector);
            } else if (rules[i].elements && rules[i].elements.length) {
                // TODO: treat HTMLElement case vs HTMLElementList
                inputs = rules[i].elements;
            }

            if (!inputs) {
                console.warn(`Could not find any elements for rule ${i}.
                Please check that you provided either a correct selector or a proper element or element list`);
                continue;
            }

            for (let j = 0; j < inputs.length; j++) {
                inputs[j].addEventListener(rules[i].validateOn, (event) => {
                    this.validate(event.target, rules[i]);
                });
                inputs[j].setAttribute(this._constants.dataAttribute, i.toString(10));
            }
        }
    },

    /**
     * Function to validate a given input against a set of rules
     * @param {Element|EventTarget} element
     * @param {ValidationRule} rule?
     */
    validate: function (element, rule) {
        const finalRule = this._resolveRule(element, rule);

        if (!finalRule) {
            console.warn('Could not find a rule for the given element.');
            return;
        }

        const value = element.value;
        const results = [];

        for (let i = 0; i < finalRule.validators.length; i++) {
            const currentRule = finalRule.validators[i];

            if (!this.utils.validators[currentRule.validator]) {
                console.warn(`${currentRule.validator} is not a valid validator function.`);
                continue;
            }

            const result = this.utils.validators[currentRule.validator](value, currentRule.options, currentRule.errors);

            if (result) {
                if (Array.isArray(result)) {
                    for (let j = 0; j < result.length; j++) {
                        const currentResult = result[j];

                        results.push({
                            type: currentRule.generate,
                            message: currentResult,
                            element: element
                        });
                    }
                } else {
                    results.push({
                        type: currentRule.generate,
                        message: result,
                        element: element
                    });
                }
            }
        }

        // TODO: take into account the `addMessages` property

        return results;
    },

    /**
     * Registers a validator that can be then be used within rules
     * @param {string} validatorName - a name by which to call the validator
     * @param {validationFunction} validatorFunction - the function to execute when calling the validator. Receives 3 parameters:
     * @return {boolean} - returns false if the validator could not be registered
     */
    registerValidator: function (validatorName, validatorFunction) {
        // Prepare for the worst, hope for the best
        try {
            if (!validatorName ||
                !validatorFunction ||
                this.utils.validators[validatorName] ||
                {}.toString.call(validatorFunction) !== '[object Function]') {
                return false;
            }

            this.utils.validators[validatorName] = validatorFunction;
            return true;
        } catch (e) {
            return false;
        }
    },

    utils: {
        validators: {
            number: function (value, options, errorMessages) {
                const errors = [];
                const number = Number(value);

                if (Number.isNaN(number)) {
                    errors.push ({
                        type: 'number',
                        message: this._getError('number', errorMessages)
                    });
                }

                if (options.min &&
                    ((options.inclusiveMin && options.min >= number) ||
                    (!options.inclusiveMin && options.min > number))) {
                    errors.push ({
                        type: 'min',
                        message: this._getError('min', errorMessages)
                    });
                }

                if (options.max &&
                    ((options.inclusiveMax && options.max <= number) ||
                    (!options.inclusiveMax && options.max < number))) {
                    errors.push ({
                        type: 'max',
                        message: this._getError('max', errorMessages)
                    });
                }

                // We do this because of math rounding errors in JS (try `5.02 / 0.1` in the console to see what I mean)
                if (options.step && !Number.isInteger(Number((number % options.step).toPrecision(12)))) {
                    errors.push ({
                        type: 'step',
                        message: this._getError('step', errorMessages)
                    });
                }

                if (options.noScientific && /\w/gi.test(value.toString())) {
                    errors.push ({
                        type: 'noScientific',
                        message: this._getError('noScientific', errorMessages)
                    });
                }

                return errors;
            },
            // TODO: all this
            range: function (value, options) {},
            pattern: function (value, options) {},
            mustNotBeEqual: function (value, options) {},
            mustBeEqual: function (value, options) {}
        },
        areInputsEqual() {}
    }
};