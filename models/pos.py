from odoo import models, fields, api




class PosConfig(models.Model):
    _inherit = 'pos.config'

    # Campo OPCIONAL: fallback si el invoice_journal_id no tiene OU asignada
    operating_unit_id = fields.Many2one(
        comodel_name='operating.unit',
        string='Unidad Operativa (manual)',
        help='Opcional. Solo se usa si el Diario de Ventas del POS '
             'no tiene una Unidad Operativa asignada.',
    )

    # Logo computado con prioridad:
    #   1. OU del invoice_journal_id (diario de ventas/facturas del POS)  ← PRIORIDAD
    #   2. OU del campo manual operating_unit_id                           ← FALLBACK
    operating_unit_report_logo = fields.Binary(
        string='Logo de Unidad Operativa',
        compute='_compute_operating_unit_report_logo',
        store=False,
    )

    @api.depends(
        'invoice_journal_id',
        'invoice_journal_id.operating_unit_id',
        'invoice_journal_id.operating_unit_id.report_logo',
        'operating_unit_id',
        'operating_unit_id.report_logo',
    )
    def _compute_operating_unit_report_logo(self):
        for config in self:
            logo = False

            # PRIORIDAD: OU del diario de ventas (invoice_journal_id)
            if (config.invoice_journal_id
                    and config.invoice_journal_id.operating_unit_id
                    and config.invoice_journal_id.operating_unit_id.report_logo):
                logo = config.invoice_journal_id.operating_unit_id.report_logo

            # FALLBACK: OU asignada manualmente en pos.config
            elif (config.operating_unit_id
                    and config.operating_unit_id.report_logo):
                logo = config.operating_unit_id.report_logo

            config.operating_unit_report_logo = logo




class PosOrder(models.Model):
    _inherit = 'pos.order'
    operating_unit_id = fields.Many2one('operating.unit', string='Unidad Operativa', readonly=True)

    @api.model
    def create(self, vals):
        # Propagate operating unit from pos config if not provided
        if not vals.get('operating_unit_id') and vals.get('config_id'):
            config = self.env['pos.config'].browse(vals.get('config_id'))
            if config and config.operating_unit_id:
                vals['operating_unit_id'] = config.operating_unit_id.id
        return super(PosOrder, self).create(vals)


class PosSession(models.Model):
    _inherit = 'pos.session'

    def _loader_params_pos_config(self):
        result = super()._loader_params_pos_config()
        result['search_params']['fields'].append('operating_unit_report_logo')
        return result
