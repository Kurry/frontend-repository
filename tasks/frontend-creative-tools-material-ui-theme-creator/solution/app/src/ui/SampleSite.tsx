import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import type { Template } from '../store';

// A themed sample site whose active template renders MUI components using the
// live theme. It never leaves the page. `deviceWidth` lets narrow frames wrap.
// Heading levels stay coherent inside the frame: one h2 per template, h3 for
// subsections — MUI Typography `component` keeps visual variants decoupled
// from document outline levels.
export function SampleSite({ template, deviceWidth }: { template: Template; deviceWidth: number }) {
  const compact = deviceWidth < 480;
  return (
    <Box sx={{ minHeight: '100%', pb: 4 }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar sx={{ gap: 1, minHeight: compact ? 52 : 64, px: compact ? 1 : 2 }}>
          <Typography variant={compact ? 'subtitle1' : 'h6'} component="span" sx={{ flexGrow: 1, fontWeight: 600 }} noWrap>
            Acme Studio
          </Typography>
          {!compact && (
            <Button color="inherit" size="small">
              Sign In
            </Button>
          )}
          <Avatar sx={{ width: compact ? 28 : 32, height: compact ? 28 : 32, bgcolor: 'secondary.main', flexShrink: 0 }}>A</Avatar>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: compact ? 1.5 : 3 }}>
        {template === 'Instructions' && <Instructions />}
        {template === 'Sign Up' && <SignUp />}
        {template === 'Dashboard' && <Dashboard compact={compact} />}
        {template === 'Blog' && <Blog />}
        {template === 'Pricing' && <Pricing compact={compact} />}
        {template === 'Checkout' && <Checkout />}
      </Box>
    </Box>
  );
}

function Instructions() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h2" fontWeight={600}>
        Live Theme Preview
      </Typography>
      <Typography color="text.secondary">
        Edit the palette, typography, and shape tools on the right. Every surface here recolors instantly from the
        same live theme options.
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained">Primary Action</Button>
        <Button variant="outlined" color="secondary">
          Secondary
        </Button>
        <Button variant="text">Text Button</Button>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label="Info" color="info" />
        <Chip label="Success" color="success" />
        <Chip label="Warning" color="warning" />
        <Chip label="Error" color="error" />
      </Stack>
    </Stack>
  );
}

function SignUp() {
  return (
    <Card sx={{ maxWidth: 420, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2" fontWeight={600}>
            Create Your Account
          </Typography>
          <TextField label="Full Name" size="small" fullWidth />
          <TextField label="Email Address" size="small" type="email" fullWidth />
          <TextField label="Password" size="small" type="password" fullWidth />
          <Button variant="contained" fullWidth>
            Sign Up
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Dashboard({ compact }: { compact: boolean }) {
  const stats = [
    { label: 'Revenue', value: '$48.2k', color: 'primary.main' },
    { label: 'Signups', value: '1,204', color: 'secondary.main' },
    { label: 'Churn', value: '2.1%', color: 'error.main' }
  ];
  return (
    <Stack spacing={2}>
      <Typography variant="h5" component="h2" fontWeight={600}>
        Overview
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)', gap: 1.5 }}>
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent>
              <Typography variant="overline" component="p" color="text.secondary">
                {s.label}
              </Typography>
              <Typography variant="h5" component="p" sx={{ color: s.color, fontWeight: 700 }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Card>
        <Box sx={{ display: 'block', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                ['#1042', 'Jordan Lee', '$120'],
                ['#1043', 'Sam Rivera', '$54'],
                ['#1044', 'Ari Chen', '$220']
              ].map((r) => (
                <TableRow key={r[0]}>
                  <TableCell>{r[0]}</TableCell>
                  <TableCell>{r[1]}</TableCell>
                  <TableCell align="right">{r[2]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Stack>
  );
}

function Blog() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 640, mx: 'auto' }}>
      <Typography variant="h4" component="h2" fontWeight={700}>
        Designing With Tokens
      </Typography>
      <Typography variant="subtitle2" component="p" color="text.secondary">
        Published by the Acme Design Team
      </Typography>
      <Divider />
      <Typography color="text.primary">
        A design token system keeps color, type, and spacing consistent across every screen. Change one value and the
        entire product follows.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Chip label="Design" color="primary" variant="outlined" />
        <Chip label="Systems" color="secondary" variant="outlined" />
      </Stack>
    </Stack>
  );
}

function Pricing({ compact }: { compact: boolean }) {
  const tiers = [
    { name: 'Starter', price: '$0', cta: 'Get Started', variant: 'outlined' as const },
    { name: 'Team', price: '$29', cta: 'Choose Team', variant: 'contained' as const },
    { name: 'Scale', price: '$99', cta: 'Choose Scale', variant: 'outlined' as const }
  ];
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)', gap: 1.5 }}>
      {tiers.map((t) => (
        <Card key={t.name}>
          <CardContent>
            <Stack spacing={1.5} alignItems="center">
              <Typography variant="h6" component="h3">{t.name}</Typography>
              <Typography variant="h4" component="p" color="primary" fontWeight={700}>
                {t.price}
              </Typography>
              <Button variant={t.variant} color="primary" fullWidth>
                {t.cta}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function Checkout() {
  return (
    <Card sx={{ maxWidth: 460, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5" component="h2" fontWeight={600}>
            Checkout
          </Typography>
          <List dense>
            <ListItem secondaryAction={<Typography component="span">$29.00</Typography>}>
              <ListItemText primary="Team Plan" secondary="Monthly" />
            </ListItem>
            <Divider component="li" />
            <ListItem secondaryAction={<Typography component="span">$2.90</Typography>}>
              <ListItemText primary="Tax" secondary="Sales tax" />
            </ListItem>
          </List>
          <TextField label="Card Number" size="small" fullWidth />
          <Button variant="contained" color="primary" fullWidth>
            Pay $31.90
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
