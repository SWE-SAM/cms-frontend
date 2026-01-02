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
        {
            id: 'documentation',
            title: 'Documentation',
            type: 'item',
            url: 'https://codedthemes.gitbook.io/berry/',
            icon: icons.IconHelp,
            external: true,
            target: true
        }
    ]
};

export default other;
