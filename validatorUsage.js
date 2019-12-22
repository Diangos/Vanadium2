/**
 *
 * @type ValidationRule[]
 */
const validationRules = [{
    selector: '.firstName',
    elements: document.querySelectorAll('.firstName'),
    preValidationFunction: () => {/* Do stuff before validation*/},
    validationFunction: () => {/* Validate stuff */},
    postValidationFunction: () => {/* Do stuff after validation*/},
    validators: [[{
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
    }]
}];

const validationObject = {

};

validator.init(validationRules, validationObject);