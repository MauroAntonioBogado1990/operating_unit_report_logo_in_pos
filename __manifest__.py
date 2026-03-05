# -*- coding: utf-8 -*-
{
    'name': 'Operating Unit Report Logo in Pos',
    'version': '13.0.1.2.0',
    'summary': 'Cambia el logo de reportes según la Unidad Operativa, incluyendo el POS.',
    'author': 'Mauro Bogado. Exemax',
    'license': 'AGPL-3',
    'category': 'Accounting',
    'depends': [
        'operating_unit',
        'account',
        'point_of_sale',
    ],
    'data': [
        'views/operating_unit_views.xml',
        'views/pos_assets.xml',
    ],
    # Los templates QWeb del POS se cargan aquí (no en 'data')
    'qweb': [
        'static/src/xml/pos_receipt_logo.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}