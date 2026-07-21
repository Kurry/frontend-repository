import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Alert, Avatar, Badge, Button, Card, CardContent, CardActions, Checkbox, FormControlLabel, LinearProgress, Paper, Radio, TextField, Typography, Switch, Slider, Chip, AppBar, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MailIcon from '@mui/icons-material/Mail';

const SECTIONS = [
    { id: 'buttons', name: 'Buttons' },
    { id: 'cards', name: 'Cards' },
    { id: 'inputs', name: 'Inputs & Controls' },
    { id: 'data', name: 'Data Display' },
    { id: 'surfaces', name: 'Surfaces' },
];

export default function ComponentsTab() {
    const activeOptions = useSelector((state: RootState) => state.theme.activeOptions);
    const [search, setSearch] = useState('');

    const filteredSections = SECTIONS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

    const muiTheme = useMemo(() => {
        const themeOpts = JSON.parse(JSON.stringify(activeOptions));
        themeOpts.palette.mode = themeOpts.palette.type;
        delete themeOpts.palette.type;
        return createTheme(themeOpts);
    }, [activeOptions]);

    return (
        <ThemeProvider theme={muiTheme}>
            <div className="flex h-full bg-[#121212] text-white">
                <div className="w-64 border-r border-gray-700 bg-[#1e1e1e] flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center bg-gray-800 rounded px-2 py-1 border border-gray-700">
                            <span className="material-symbols-outlined text-gray-400 text-sm mr-2">search</span>
                            <input
                                type="search"
                                aria-label="Search components"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500"
                            />
                        </div>
                    </div>
                    <nav className="flex-1 overflow-auto p-2">
                        {filteredSections.map(s => (
                            <a
                                key={s.id}
                                href={`#comp-${s.id}`}
                                className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
                            >
                                {s.name}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="flex-1 overflow-auto p-8 scroll-smooth" style={{ backgroundColor: muiTheme.palette.background.default }}>
                    <div className="max-w-4xl mx-auto space-y-12 pb-32">
                        <Typography color="text.secondary" data-gallery-count>25 themed component demos</Typography>

                        <section id="comp-buttons" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'buttons')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Buttons</Typography>
                            <div className="flex flex-wrap gap-4 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <Button data-component-demo variant="contained" color="primary">Primary</Button>
                                <Button data-component-demo variant="contained" color="secondary">Secondary</Button>
                                <Button data-component-demo variant="outlined" color="primary">Outlined</Button>
                                <Button data-component-demo variant="text" color="primary">Text</Button>
                                <Button data-component-demo variant="contained" color="primary" disabled>Disabled</Button>
                            </div>
                        </section>

                        <section id="comp-cards" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'cards')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Cards</Typography>
                            <div className="flex flex-wrap gap-4">
                                <Card data-component-demo sx={{ minWidth: 275, maxWidth: 345 }}>
                                    <CardContent>
                                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>Word of the Day</Typography>
                                        <Typography variant="h5" component="div">be·nev·o·lent</Typography>
                                        <Typography sx={{ mb: 1.5 }} color="text.secondary">adjective</Typography>
                                        <Typography variant="body2">well meaning and kindly.<br />{'"a benevolent smile"'}</Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small">Learn More</Button>
                                    </CardActions>
                                </Card>
                            </div>
                        </section>

                        <section id="comp-inputs" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'inputs')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Inputs & Controls</Typography>
                            <div className="flex flex-col gap-6 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <div className="flex items-center gap-4">
                                    <Switch data-component-demo defaultChecked color="primary" inputProps={{ 'aria-label': 'Primary switch' }} />
                                    <Switch data-component-demo defaultChecked color="secondary" inputProps={{ 'aria-label': 'Secondary switch' }} />
                                    <Switch data-component-demo disabled inputProps={{ 'aria-label': 'Disabled switch' }} />
                                </div>
                                <div className="w-64">
                                    <Typography gutterBottom color="text.primary">Volume</Typography>
                                    <Slider data-component-demo defaultValue={30} aria-label="Volume" color="primary" />
                                </div>
                                <TextField data-component-demo label="Text field" defaultValue="Themed input" />
                                <FormControlLabel data-component-demo control={<Checkbox defaultChecked />} label="Checkbox" />
                                <FormControlLabel data-component-demo control={<Radio defaultChecked />} label="Radio" />
                            </div>
                        </section>

                        <section id="comp-data" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'data')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Data Display</Typography>
                            <div className="flex flex-wrap gap-4 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <Chip data-component-demo label="Primary" color="primary" />
                                <Chip data-component-demo label="Secondary" color="secondary" variant="outlined" />
                                <Badge data-component-demo badgeContent={4} color="primary">
                                    <MailIcon color="action" />
                                </Badge>
                                <Badge data-component-demo badgeContent={4} color="secondary">
                                    <MailIcon color="action" />
                                </Badge>
                                <Avatar data-component-demo sx={{ bgcolor: 'primary.main' }}>M</Avatar>
                                <Alert data-component-demo severity="success">Theme ready</Alert>
                                <div data-component-demo className="w-40 self-center" aria-label="Linear progress demo"><LinearProgress variant="determinate" value={68} /></div>
                            </div>
                        </section>

                        <section id="comp-surfaces" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'surfaces')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Surfaces (AppBar)</Typography>
                            <AppBar data-component-demo position="static" color="primary">
                                <Toolbar>
                                    <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                                        <MenuIcon />
                                    </IconButton>
                                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                                        News
                                    </Typography>
                                    <Button color="inherit">Login</Button>
                                </Toolbar>
                            </AppBar>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <Paper data-component-demo elevation={1} sx={{ p: 2 }}>Elevation 1</Paper>
                                <Paper data-component-demo elevation={8} sx={{ p: 2 }}>Elevation 8</Paper>
                                <Button data-component-demo variant="contained" color="success">Success action</Button>
                                <Button data-component-demo variant="outlined" color="error">Destructive action</Button>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}
