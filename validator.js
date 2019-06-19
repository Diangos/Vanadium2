/**
 * Vanadium 2
 * Made by Merlas Tudor (Diangos)
 */

/**
 * @typedef {Object} Validator
 * @prop {string} generate
 * @prop {string} validator
 * @prop {object} options
 */

/**
 * @typedef {Object} ValidationRule
 * @prop {string} selector - The selector used to obtain all elements to apply event listeners to
 * @prop {HTMLElementList|HTMLElement} elements - The actual elements the validator will apply event listeners to
 * @prop {string} validateOn - The type of event the validator should bind to
 * @prop {boolean} validationOr - Determines if the validators are applied ANDed or ORed
 * @prop {Validator[]} validators - An array of all the validators to apply with their individual options
 */


const validator = {

    _constants: {
        dataAttribute: 'data-validation-index'
    },
    _rules: [],

    /**
     *
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

            const result = this.utils.validators[currentRule.validator](value, currentRule.options);

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

        return results;
    },

    registerCustomValidator: function (validatorName, validatorFunction) {
        if (!validatorName ||
            !validatorFunction ||
            this.utils.validators[validatorName] ||
            {}.toString.call(validatorFunction) !== '[object Function]') {
            return;
        }

        this.utils.validators[validatorName] = validatorFunction;
    },

    utils: {
        validators: {
            // TODO: all this
            number: function (value, options) {},
            range: function (value, options) {},
            pattern: function (value, options) {},
            mustNotBeEqual: function (value, options) {},
            mustBeEqual: function (value, options) {}
        },
        areInputsEqual() {}
    }
};