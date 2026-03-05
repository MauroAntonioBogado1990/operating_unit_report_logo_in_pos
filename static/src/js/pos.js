odoo.define('operating_unit_report_logo.pos', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    // Le decimos al POS que descargue el logo de la unidad operativa al inicializar
    models.load_fields('pos.config', ['ou_report_logo']);
});