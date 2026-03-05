from odoo import models, fields


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    operating_unit_id = fields.Many2one('operating.unit', string='Unidad Operativa')

    def _prepare_invoice(self):
        inv_vals = super(SaleOrder, self)._prepare_invoice()
        inv_vals['operating_unit_id'] = self.operating_unit_id.id
        return inv_vals
