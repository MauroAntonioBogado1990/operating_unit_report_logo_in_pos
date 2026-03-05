from odoo import models, fields, api




class PosConfig(models.Model):
    _inherit = 'pos.config'
    
    # Campo que el usuario selecciona manualmente en el formulario del POS
    operating_unit_id = fields.Many2one(
        comodel_name='operating.unit',
        string='Unidad Operativa',
        help='Seleccione la Unidad Operativa cuyo logo se imprimirá en los recibos del POS.',
    )

    # Campo computado que expone el binario del logo al frontend JS
    operating_unit_report_logo = fields.Binary(
        string='Logo de Unidad Operativa',
        compute='_compute_operating_unit_report_logo',
        store=False,
    )

    @api.depends('operating_unit_id', 'operating_unit_id.report_logo')
    def _compute_operating_unit_report_logo(self):
        for config in self:
            if config.operating_unit_id and config.operating_unit_id.report_logo:
                config.operating_unit_report_logo = config.operating_unit_id.report_logo
            else:
                config.operating_unit_report_logo = False

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
