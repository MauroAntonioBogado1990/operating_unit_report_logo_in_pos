odoo.define('operating_unit_report_logo.pos_receipt_logo', function (require) {
    'use strict';

    var models  = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');

    // -------------------------------------------------------------------------
    // Helper: agrega el prefijo data:image/png;base64, si no lo tiene.
    // Odoo devuelve los campos Binary como base64 puro sin prefijo.
    // El <img src="..."> necesita el prefijo para renderizar la imagen.
    // -------------------------------------------------------------------------
    function _formatLogoSrc(b64) {
        if (!b64) { return false; }
        if (b64.indexOf('data:') === 0) { return b64; }
        return 'data:image/png;base64,' + b64;
    }

    // -------------------------------------------------------------------------
    // Extensión del PosModel: helper central para obtener el logo correcto
    // -------------------------------------------------------------------------
    models.PosModel = models.PosModel.extend({

        // Devuelve { src, raw } donde:
        //   src → string con prefijo data:image/... para usar en <img src>
        //   raw → base64 puro para usar en t-att-src de QWeb
        _getReceiptLogo: function () {
            var config = this.config;
            var raw = (config && config.operating_unit_report_logo)
                ? config.operating_unit_report_logo
                : (this.company && this.company.logo ? this.company.logo : false);

            if (!raw) { return { src: false, raw: false }; }
            return {
                src: _formatLogoSrc(raw),
                raw: raw,
            };
        },
    });

    // -------------------------------------------------------------------------
    // Helper: inyecta el logo en todas las rutas que QWeb puede consultar.
    //
    // En Odoo 13 la plantilla point_of_sale.receipt puede leer el logo desde:
    //   · receipt.company.logo           (la más común, con prefijo data:)
    //   · env.company.logo               (fallback)
    //   · receipt.company.operating_unit_report_logo  (nuestro override QWeb)
    // -------------------------------------------------------------------------
    function _applyLogoToEnv(env, logo) {
        if (!logo || !logo.src) { return env; }

        env = _.extend({}, env);

        // --- Ruta 1: receipt.company ---
        var receipt        = _.extend({}, env.receipt || {});
        var receiptCompany = _.extend({}, receipt.company || {});
        receiptCompany.logo                        = logo.src;   // con prefijo
        receiptCompany.operating_unit_report_logo  = logo.raw;   // sin prefijo (para t-att-src)
        receipt.company = receiptCompany;
        env.receipt     = receipt;

        // --- Ruta 2: env.company ---
        if (env.company) {
            env.company = _.extend({}, env.company, {
                logo:                       logo.src,
                operating_unit_report_logo: logo.raw,
            });
        }

        return env;
    }

    // -------------------------------------------------------------------------
    // Override ReceiptScreenWidget (pantalla de recibo tras cada venta)
    // -------------------------------------------------------------------------
    screens.ReceiptScreenWidget.include({
        get_receipt_render_env: function () {
            var env  = this._super.apply(this, arguments);
            var logo = this.pos._getReceiptLogo ? this.pos._getReceiptLogo() : null;
            return _applyLogoToEnv(env, logo);
        },
    });

    // -------------------------------------------------------------------------
    // Override PaymentScreenWidget (también puede imprimir el recibo)
    // -------------------------------------------------------------------------
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