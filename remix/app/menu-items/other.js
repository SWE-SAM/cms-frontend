// assets
import { IconBrandChrome, IconHelp } from '../../node_modules/@tabler/icons-react';

// constant
const icons = {
    IconBrandChrome,
    IconHelp
};

// ==============================|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||============================== //

const other = {
    id: 'sample-docs-roadmap',
    title: 'Utilities',
    type: 'group',
    children: [
        {
            id: 'Submit Complaint',
            title: 'Submit Complaint',
            type: 'item',
            url: '/submit-complaint',
            icon: icons.IconBrandChrome,
            breadcrumbs: false
        },
        
    ]
};

export default other;
