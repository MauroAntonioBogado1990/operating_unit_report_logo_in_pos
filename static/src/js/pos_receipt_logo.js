odoo.define('operating_unit_report_logo.pos_receipt_logo', function (require) {
    'use strict';

    var models  = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');

    // =========================================================================
    // 1. Cargar el campo operating_unit_id desde account.journal al frontend.
    //    Sin esto, el JS nunca sabe qué OU tiene el diario de ventas.
    // =========================================================================
    models.load_fields('account.journal', ['operating_unit_id']);

    // =========================================================================
    // 2. Cargar el modelo operating.unit con su report_logo.
    //    Se carga DESPUÉS de account.journal para poder enlazarlos.
    // =========================================================================
    models.load_models([{
        model:  'operating.unit',
        fields: ['id', 'name', 'report_logo'],
        loaded: function (self, operating_units) {
            // Indexamos por ID para acceso rápido desde el JS
            self.operating_units_by_id = {};
            _.each(operating_units, function (ou) {
                self.operating_units_by_id[ou.id] = ou;
            });
        },
    }]);

    // =========================================================================
    // 3. Helper: agrega prefijo data:image/png;base64, si falta.
    //    Odoo envía Binary como base64 puro; <img src> necesita el prefijo.
    // =========================================================================
    function _formatLogoSrc(b64) {
        if (!b64) { return false; }
        if (b64.indexOf('data:') === 0) { return b64; }
        return 'data:image/png;base64,' + b64;
    }

    // =========================================================================
    // 4. Extensión del PosModel: lógica central de resolución del logo.
    //
    //    Prioridad:
    //      1. OU del invoice_journal_id (diario de ventas del POS)  ← PRINCIPAL
    //      2. OU del campo manual operating_unit_id en pos.config   ← FALLBACK
    //      3. Logo de compañía estándar                             ← DEFAULT
    // =========================================================================
    models.PosModel = models.PosModel.extend({

        _getReceiptLogo: function () {
            var config = this.config;
            var raw    = false;

            // --- PRIORIDAD: OU del diario de ventas (invoice_journal_id) ---
            if (config && config.invoice_journal_id) {
                // invoice_journal_id llega como [id, name] en el frontend JS
                var journalId = _.isArray(config.invoice_journal_id)
                    ? config.invoice_journal_id[0]
                    : config.invoice_journal_id;

                var journal = journalId && this.journals
                    ? _.findWhere(this.journals, { id: journalId })
                    : null;

                if (journal && journal.operating_unit_id) {
                    var ouId = _.isArray(journal.operating_unit_id)
                        ? journal.operating_unit_id[0]
                        : journal.operating_unit_id;

                    var ou = this.operating_units_by_id
                        ? this.operating_units_by_id[ouId]
                        : null;

                    if (ou && ou.report_logo) {
                        raw = ou.report_logo;
                    }
                }
            }

            // --- FALLBACK: logo computado que ya viene en pos.config ---
            if (!raw && config && config.operating_unit_report_logo) {
                raw = config.operating_unit_report_logo;
            }

            // --- DEFAULT: logo de compañía ---
            if (!raw && this.company && this.company.logo) {
                raw = this.company.logo;
            }

            if (!raw) { return { src: false, raw: false }; }
            return { src: _formatLogoSrc(raw), raw: raw };
        },
    });

    // =========================================================================
    // 5. Helper: inyecta el logo en el entorno de renderizado QWeb.
    //    Cubre todas las rutas donde la plantilla del recibo busca el logo.
    // =========================================================================
    function _applyLogoToEnv(env, logo) {
        if (!logo || !logo.src) { return env; }

        env = _.extend({}, env);

        // Ruta principal: receipt.company.logo
        var receipt        = _.extend({}, env.receipt || {});
        var receiptCompany = _.extend({}, receipt.company || {});
        receiptCompany.logo                       = logo.src;
        receiptCompany.operating_unit_report_logo = logo.raw;
        receipt.company = receiptCompany;
        env.receipt     = receipt;

        // Ruta alternativa: env.company.logo
        if (env.company) {
            env.company = _.extend({}, env.company, {
                logo:                       logo.src,
                operating_unit_report_logo: logo.raw,
            });
        }

        return env;
    }

    // =========================================================================
    // 6. Override de los widgets de recibo
    // =========================================================================
    screens.ReceiptScreenWidget.include({
        get_receipt_render_env: function () {
            var env  = this._super.apply(this, arguments);
            var logo = this.pos._getReceiptLogo ? this.pos._getReceiptLogo() : null;
            return _applyLogoToEnv(env, logo);
        },
    });

    if (screens.PaymentScreenWidget) {
        screens.PaymentScreenWidget.include({
            get_receipt_render_env: function () {
                var env  = this._super.apply(this, arguments);
                var logo = this.pos._getReceiptLogo ? this.pos._getReceiptLogo() : null;
                return _applyLogoToEnv(env, logo);
            },
        });
    }

    return {};
});