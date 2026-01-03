import { useDispatch, useSelector } from 'react-redux';
import { Link } from '@remix-run/react';

// material-ui
import { ButtonBase, Typography } from '@mui/material';

// project imports
import { MENU_OPEN } from 'store/actions';

import config from '../../../../config';

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => {
    const defaultId = useSelector((state) => state.customization.defaultId);
    const dispatch = useDispatch();

    return (
        <ButtonBase
            disableRipple
            onClick={() => dispatch({ type: MENU_OPEN, id: defaultId })}
            component={Link}
            to={config.defaultPath}
            sx={{ px: 1 }}
        >
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textTransform: 'none',
                    whiteSpace: 'nowrap'
                }}
            >
                Complaint Management System
            </Typography>
        </ButtonBase>
    );
};

export default LogoSection;
