from odoo import models, fields, api


class AccountMove(models.Model):
    _inherit = 'account.move'

    operating_unit_id = fields.Many2one(
        comodel_name='operating.unit',
        string='Unidad Operativa',
        readonly=True,  # El usuario nunca lo toca, se asigna automáticamente
        store=True,
    )

    @api.onchange('journal_id')
    def _onchange_journal_operating_unit(self):
        """
        Cuando el usuario cambia el diario en la pantalla de la factura,
        la OU se actualiza automáticamente desde el diario.
        """
        for move in self:
            if move.journal_id and move.journal_id.operating_unit_id:
                move.operating_unit_id = move.journal_id.operating_unit_id
            else:
                move.operating_unit_id = False

    @api.model
    def create(self, vals):
        """
        Al crear una factura (manual, desde POS, o cualquier automatismo),
        toma la OU del diario si no viene explícitamente.
        """
        if not vals.get('operating_unit_id') and vals.get('journal_id'):
            journal = self.env['account.journal'].browse(vals['journal_id'])
            if journal.operating_unit_id:
                vals['operating_unit_id'] = journal.operating_unit_id.id
        return super(AccountMove, self).create(vals)

    def write(self, vals):
        """
        Si se cambia el diario en una factura existente,
        actualiza la OU automáticamente.
        """
        if 'journal_id' in vals and not vals.get('operating_unit_id'):
            journal = self.env['account.journal'].browse(vals['journal_id'])
            if journal.operating_unit_id:
                vals['operating_unit_id'] = journal.operating_unit_id.id
        return super(AccountMove, self).write(vals)