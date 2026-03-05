from odoo import models, fields


class OperatingUnit(models.Model):
    _inherit = "operating.unit"

    report_logo = fields.Binary("Logo Reporte", attachment=True,
                               help="Logo used in reports for this operating unit. Falls back to company logo.")
