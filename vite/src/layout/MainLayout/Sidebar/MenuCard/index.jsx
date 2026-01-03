import PropTypes from 'prop-types';
import { memo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// assets
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';

// ==============================|| PROGRESS BAR WITH LABEL ||============================== //

function LinearProgressWithLabel({ value, ...others }) {
  return (
    <Stack sx={{ gap: 1 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: 'primary.800'
          }}
        >
          Progress
        </Typography>
        <Typography variant="h6" sx={{ color: 'inherit' }}>{`${Math.round(value)}%`}</Typography>
      </Stack>
      <LinearProgress
        aria-label="progress of theme"
        variant="determinate"
        value={value}
        {...others}
        sx={{
          height: 10,
          borderRadius: 30,
          [`&.${linearProgressClasses.colorPrimary}`]: {
            bgcolor: 'background.paper'
          },
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 5,
            bgcolor: 'primary.dark'
          }
        }}
      />
    </Stack>
  );
}

// ==============================|| SIDEBAR - MENU CARD ||============================== //



LinearProgressWithLabel.propTypes = { value: PropTypes.number, others: PropTypes.any };
