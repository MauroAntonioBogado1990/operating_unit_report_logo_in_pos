from odoo import models, fields, api


class AccountMove(models.Model):
    _inherit = 'account.move'

    operating_unit_id = fields.Many2one('operating.unit', string='Unidad Operativa')

    @api.model
    def create(self, vals):
        # Propagate operating unit from journal if not provided
        if not vals.get('operating_unit_id') and vals.get('journal_id'):
            journal = self.env['account.journal'].browse(vals.get('journal_id'))
            if journal and journal.operating_unit_id:
                vals['operating_unit_id'] = journal.operating_unit_id.id
        return super(AccountMove, self).create(vals)

    def write(self, vals):
        # If journal_id is set/changed and operating_unit_id not provided, set it from journal
        if 'journal_id' in vals and not vals.get('operating_unit_id'):
            journal = self.env['account.journal'].browse(vals.get('journal_id'))
            if journal and journal.operating_unit_id:
                vals['operating_unit_id'] = journal.operating_unit_id.id
        return super(AccountMove, self).write(vals)
