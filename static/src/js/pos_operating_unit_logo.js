odoo.define('operating_unit_report_logo.pos_operating_unit_logo', function(require){
    'use strict';

    var models = require('point_of_sale.models');
    var PosModel = require('point_of_sale.models');

    // Load extra fields from pos.config into POS frontend
    models.load_fields('pos.config', ['operating_unit_report_logo', 'operating_unit_partner_image', 'operating_unit_id']);

    // Ensure new orders get the operating_unit_id from config so receipts/templates can use it before sync
    var _OrderSuper = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function(attr, options){
            _OrderSuper.initialize.apply(this, arguments);
            try{
                // If pos.config exposes an operating unit logo, attach a minimal object
                // to the order so client-side templates can read order.operating_unit_id.report_logo
                if (!this.get('operating_unit_id') && this.pos && this.pos.config){
                    var cfg = this.pos.config;
                    var cfg_u = cfg.operating_unit_id;
                    var logo = cfg.operating_unit_report_logo || cfg.operating_unit_partner_image || null;
                    if (logo){
                        // operating_unit_id on orders is usually an id; provide an object with report_logo for templates
                        var ou = { id: Array.isArray(cfg_u) ? cfg_u[0] : cfg_u || 0, report_logo: 'data:image/png;base64,' + logo };
                        this.set('operating_unit_id', ou);
                    } else if (cfg_u){
                        // fallback: set id only
                        this.set('operating_unit_id', Array.isArray(cfg_u) ? cfg_u[0] : cfg_u);
                    }
                }
            }catch(e){console.error('operating_unit_report_logo: set operating_unit on order failed', e);}
        },
    });

});
