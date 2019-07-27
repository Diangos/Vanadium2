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
        invalidMessage: 'The input is not valid.',
        tokenSeparator: /{{|}}/
    },
    _errorMessages: {
        number: {
            number: 'The value is not a valid number.',
            min: 'The number is smaller than the allowed minimum.',
            max: 'The number is greater than the allowed maximum.',
            step: 'The number not divisible by the step.',
            noScientific: 'The number can not have a scientific notation.',
        }
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

        this.utils.polyfills.matches();

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

            const result = this.utils.validators[currentRule.validator](
                value,
                currentRule.options, element);

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
     * @param {object} errorMessages - An object with the 'error type': 'default error message pairs'
     * @return {boolean} - returns false if the validator could not be registered
     */
    registerValidator: function (validatorName, validatorFunction, errorMessages) {
        // Prepare for the worst, hope for the best
        try {
            if (!validatorName ||
                typeof validatorName !== 'string' ||
                !validatorFunction ||
                this.utils.validators[validatorName] ||
                {}.toString.call(validatorFunction) !== '[object Function]') {
                return false;
            }

            if (errorMessages && typeof errorMessages === 'object' && Object.keys(errorMessages).length) {
                this._errorMessages[validatorName] = errorMessages;
            }

            this.utils.validators[validatorName] = validatorFunction;
            return true;
        } catch (e) {
            return false;
        }
    },

    utils: {
        validators: {
            number: function (value, options) {
                const errors = [];
                const number = Number(value);

                if (Number.isNaN(number)) {
                    errors.push ({type: 'number'});
                    return errors;
                }

                if (options) {
                    if (options.min &&
                        ((options.inclusiveMin && options.min >= number) ||
                            (!options.inclusiveMin && options.min > number))) {
                        errors.push({type: 'min'});
                    }

                    if (options.max &&
                        ((options.inclusiveMax && options.max <= number) ||
                            (!options.inclusiveMax && options.max < number))) {
                        errors.push({type: 'max'});
                    }

                    // We do this because of math rounding errors in JS (try `5.02 / 0.1` in the console to see what I mean)
                    if (options.step &&
                        !Number.isInteger(Number((number / options.step).toPrecision(12)))) {
                        errors.push({type: 'step'});
                    }

                    if (options.noScientific && /\w/gi.test(value.toString())) {
                        errors.push({type: 'noScientific'});
                    }
                }

                return errors;
            },
            range: function (value, options) {
                const errors = [];

                if (!value || typeof value !== 'string') {
                    errors.push({type: 'range'});
                    return errors;
                }

                let sectionRegExp = '-?\\d*(.\\d*)?';
                let spaces = '';

                if (options) {
                    if (!options.noScientific) {
                        sectionRegExp = `${sectionRegExp}(e-?\\d*)?`
                    }

                    if (options.openEnded) {
                        sectionRegExp = `\\?|(${sectionRegExp})`;
                    }

                    if (!options.noSpaces) {
                        spaces = '\\s*';
                    }
                }

                const finalRegExp = new RegExp('' +
                    spaces +
                    sectionRegExp +
                    spaces +
                    '-' +
                    spaces +
                    sectionRegExp +
                    spaces);

                // If it is not a valid range we have nothing more to test
                if (!finalRegExp.test(value)) {
                    errors.push({type: 'range'});
                    return errors;
                }

                // Check if it has more than one open end if open ended is allowed
                if (options && options.openEnded && (value.match(/\?/g) || []).length >= 2) {
                    errors.push({type: 'openEnded'});
                }

                let lowerTerm, upperTerm,
                    lowerErrors, upperErrors;

                const match = value.match(new RegExp(sectionRegExp));

                lowerTerm = match[0];
                upperTerm = match[1];

                if (lowerTerm.indexOf('?') === -1) {
                    lowerErrors = this.utils.validators.number(lowerTerm, options);
                    lowerTerm = Number(lowerTerm);
                }

                if (upperTerm.indexOf('?') === -1) {
                    upperErrors = this.utils.validators.number(upperTerm, options);
                    upperTerm = Number(upperTerm);
                }

                if (upperTerm < lowerTerm) {
                    errors.push({type: 'range'});
                }

                const errorTypes = {}; // We don't want duplicate errors

                for (let i = 0; i < lowerErrors.length; i++) {
                    errors.push(lowerErrors[i]);
                    errorTypes[lowerErrors[i].type] = true;
                }

                for (let i = 0; i < upperErrors.length; i++) {
                    if (!errorTypes[upperErrors[i].type]) {
                        errors.push(upperErrors[i]);
                    }
                }

                return errors;
            },
            pattern: function (value, options) {
                const errors = [];

                if (!value) {
                    errors.push({type: 'pattern'});
                    return errors;
                }

                if (options && options.pattern) {
                    let pattern;

                    if (!options.pattern instanceof RegExp) {
                        if (typeof options.pattern === 'string') {
                            pattern = new RegExp(options.pattern);
                        } else {
                            console.warn(`${options.pattern} is not a valid RegEx or RegEx string.`);
                            return [];
                        }
                    } else {
                        pattern = options.pattern;
                    }

                    if (!pattern.test(value)) {
                        errors.push({type: 'pattern'})
                    }
                }

                return errors;
            },
            mustNotBeEqual: function (value, options, element) {
                const errors = [];

                if (!element || !options || !options.targets || typeof options.targets !== 'string') {
                    return errors;
                }

                let elements = [];

                for (let i = 0; i < options.targets.length; i++) {
                    const target = options.targets[i];
                    const currentTargetElements = this.utils.tokenResolver(element, target);

                    if (currentTargetElements.length) {
                        elements = elements.concat(currentTargetElements);
                    } else {
                        elements.push(currentTargetElements);
                    }
                }
                const areEqual = this.utils.areInputsEqual(elements, options.equalityType);

                if (areEqual) {
                    errors.push({type: 'areNotEqual'});
                }

                return errors;
            },
            mustBeEqual: function (value, options, element) {
                const errors = [];
                const newOptions = {
                    targets: options.targets,
                    equalityType: options.equalityType === "some" ? "all" : "some"
                };

                let result = this.mustNotBeEqual(value, newOptions, element);

                if (!result.length) {
                    errors.push({type: 'mustNotEqual'});
                }

                return errors;
            }
        },
        traversal: {
            find: function (elements, tokenOptions) {
                let elementCollection = [];

                if (!elements || !elements.length || tokenOptions || typeof tokenOptions !== 'string') {
                    return elementCollection;
                }

                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element && element instanceof Element) {
                        elementCollection = Array.prototype.concat.call(elementCollection, element.querySelectorAll(tokenOptions));
                    }
                }

                return elementCollection;
            },
            closest: function(elements, tokenOptions) {
                let elementCollection = [];

                if (!elements || !elements.length || tokenOptions) {
                    return elementCollection;
                }

                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element && element instanceof Element) {
                        let newElement = element.parentElement;

                        while (newElement !== null) {
                            if (newElement.matches(tokenOptions)) {
                                elementCollection = Array.prototype.concat.call(elementCollection, newElement);
                            } else {
                                newElement = newElement.parentElement;
                            }
                        }
                    }
                }

                return elementCollection;
            },
            siblings: function (elements, tokenOptions) {
                let elementCollection = [];

                if (!elements || !elements.length) {
                    return elementCollection;
                }

                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element && element instanceof Element && tokenOptions) {
                        const siblings = [];
                        let sibling = element.parentNode.firstChild;

                        // Loop through each sibling and push to the array
                        while (sibling !== null) {
                            if (sibling.nodeType === 1 && sibling !== element && sibling.matches(tokenOptions)) {
                                siblings.push(sibling);
                            }
                            sibling = sibling.nextSibling;
                        }

                        elementCollection = Array.prototype.concat.call(elementCollection, siblings);
                    }
                }

                return elementCollection;
            },
            parent: function (elements, tokenOptions) {
                let elementCollection = [];

                if (!elements || !elements.length) {
                    return elementCollection;
                }

                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];

                    if (element && element instanceof Element) {
                        if (tokenOptions) {
                            if (element.parentElement.matches(tokenOptions)) {
                                elementCollection = Array.prototype.concat.call(elementCollection, element.parentElement);
                            }
                        } else {
                            elementCollection = Array.prototype.concat.call(elementCollection, element.parentElement);
                        }
                    }
                }

                return elementCollection;
            }
        },
        polyfills: {
            matches: function () {
                if (Element && !Element.prototype.matches) {
                    let prototype = Element.prototype;

                    prototype.matches =
                        prototype.matchesSelector ||
                        prototype.webkitMatchesSelector ||
                        prototype.mozMatchesSelector ||
                        prototype.msMatchesSelector ||
                        prototype.oMatchesSelector;
                }
            }
        },
        /**
         * Ensures that whatever is given as a parameter is transformed into something iterate-able
         * @param {HTMLElement|HTMLElement[]|HTMLCollection} element
         * @return {HTMLCollection|HTMLElement[]}
         */
        transformToCollection(element) {
            if (!element) {
                return [];
            }

            if (element instanceof Node) {
                return [element]
            }

            if (element.length) {
                return element;
            }

            return [];
        },
        /**
         * Gets elements starting from a given element via a tokenized path
         * @param {HTMLElement|HTMLElement[]|HTMLCollection} elements - elements to start searching from
         * @param {string} tokenizedString - a tokenized path to the input
         * @return {HTMLElement[]}
         */
        tokenResolver(elements, tokenizedString) {
            if (!elements || !tokenizedString) {
                return [elements];
            }

            elements = this.utils.transformToCollection(elements);

            let elementsPool = [];

            const splitTokens = tokenizedString.split(this._constants.tokenSeparator);

            for (let i = 0; i < elements.length; i++) {
                let foundElements = elements[i];

                for (let j = 0; j < splitTokens.length; j++) {
                    const currentToken = splitTokens[j].trim();

                    if (currentToken === '') {
                        continue;
                    }

                    // Tokens can only be odd indices
                    if (i % 2 !== 0) {
                        const splitCurrentToken = currentToken.split('@');

                        foundElements = this.utils.traversal[splitCurrentToken[0]](foundElements, splitCurrentToken[1]);
                    } else {
                        foundElements = this.utils.traversal.find(foundElements, currentToken);
                    }
                }

                elementsPool = Array.prototype.concat.call(elementsPool, foundElements);
            }

            return elementsPool;
        },
        /**
         * Verifies if all or some of the given inputs have the same value
         * @param {HTMLCollection|HTMLElement[]} elements - the inputs to check that are equal
         * @param {('all'|'some')} [type='all'] - determines if the function should check that at least 2 or all inputs are equal
         * @return {boolean}
         */
        areInputsEqual(elements, type) {
            if (!elements || !elements.length || elements.length < 2) {
                return false;
            }

            if (type !== 'some') {
                type = 'all';
            }

            let previousValue = elements[0];

            for (let i = 1; i < elements.length; i++) {
                const element = elements[i];

                if (element.value !== previousValue) {
                    return type === 'all';
                }
            }

            return type !== 'all';
        }
    }
};