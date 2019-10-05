const validationObject = [{
    selector: '.firstName',
    elements: document.querySelectorAll('.firstName'),
    validateOn: 'blur',
    addMessages: true,
    validationOr: true,     // By default, all errors are treated as AND
    validators: [{
        generate: 'warning',
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
    }, {
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

validator.init(validationObject);