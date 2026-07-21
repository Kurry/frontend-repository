import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
    Button, Card, CardContent, CardActions, Typography, Switch, Slider, Chip, AppBar, Toolbar, IconButton, Badge,
    Checkbox, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
    TextField, InputAdornment, List, ListItem, ListItemText, ListItemIcon,
    DialogTitle, DialogContent, DialogContentText, DialogActions, Paper,
    Accordion, AccordionSummary, AccordionDetails, Tooltip, CircularProgress, LinearProgress,
    SnackbarContent, BottomNavigation, BottomNavigationAction, Fab
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MailIcon from '@mui/icons-material/Mail';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const SECTIONS = [
    { id: 'buttons', name: 'Buttons & Fabs' },
    { id: 'cards', name: 'Cards' },
    { id: 'inputs', name: 'Inputs & Controls' },
    { id: 'textfields', name: 'Text Fields' },
    { id: 'data', name: 'Data Display & Lists' },
    { id: 'feedback', name: 'Feedback' },
    { id: 'surfaces', name: 'Surfaces & Dialogs' },
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

                        <section id="comp-buttons" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'buttons')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Buttons & Fabs</Typography>
                            <div className="flex flex-wrap gap-4 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <div className="flex w-full gap-4 mb-4">
                                    <Button variant="contained" color="primary">Primary</Button>
                                    <Button variant="contained" color="secondary">Secondary</Button>
                                    <Button variant="outlined" color="primary">Outlined</Button>
                                    <Button variant="text" color="primary">Text</Button>
                                    <Button variant="contained" color="primary" disabled>Disabled</Button>
                                </div>
                                <div className="flex w-full gap-4 items-center">
                                    <Fab color="primary" aria-label="add"><AddIcon /></Fab>
                                    <Fab color="secondary" aria-label="edit"><MenuIcon /></Fab>
                                    <Fab disabled aria-label="like"><FavoriteIcon /></Fab>
                                </div>
                            </div>
                        </section>

                        <section id="comp-cards" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'cards')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Cards</Typography>
                            <div className="flex flex-wrap gap-4">
                                <Card sx={{ minWidth: 275, maxWidth: 345 }}>
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
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Switch defaultChecked color="primary" />
                                    <Switch defaultChecked color="secondary" />
                                    <Switch disabled />
                                    <Checkbox defaultChecked color="primary" />
                                    <Checkbox defaultChecked color="secondary" />
                                    <Checkbox disabled />
                                </div>
                                <div className="flex w-full">
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" color="primary">Radio Group</FormLabel>
                                        <RadioGroup row defaultValue="a">
                                            <FormControlLabel value="a" control={<Radio color="primary" />} label="Option A" sx={{ color: muiTheme.palette.text.primary }} />
                                            <FormControlLabel value="b" control={<Radio color="secondary" />} label="Option B" sx={{ color: muiTheme.palette.text.primary }} />
                                        </RadioGroup>
                                    </FormControl>
                                </div>
                                <div className="w-64">
                                    <Typography gutterBottom color="text.primary">Volume</Typography>
                                    <Slider defaultValue={30} aria-label="Volume" color="primary" valueLabelDisplay="auto" />
                                </div>
                            </div>
                        </section>

                        <section id="comp-textfields" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'textfields')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Text Fields</Typography>
                            <div className="flex flex-col gap-6 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <div className="flex gap-4">
                                    <TextField label="Standard" variant="standard" color="primary" />
                                    <TextField label="Filled" variant="filled" color="secondary" />
                                    <TextField label="Outlined" variant="outlined" color="primary" />
                                </div>
                                <div className="flex gap-4">
                                    <TextField error label="Error" defaultValue="Hello World" variant="outlined" helperText="Incorrect entry." />
                                    <TextField disabled label="Disabled" defaultValue="Hello World" variant="outlined" />
                                </div>
                            </div>
                        </section>

                        <section id="comp-data" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'data')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Data Display</Typography>
                            <div className="flex flex-wrap gap-4 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <Chip label="Primary" color="primary" />
                                <Chip label="Secondary" color="secondary" variant="outlined" />
                                <Badge badgeContent={4} color="primary">
                                    <MailIcon color="action" />
                                </Badge>
                                <Badge badgeContent={4} color="secondary">
                                    <MailIcon color="action" />
                                </Badge>
                            </div>
                        </section>

                        <section id="comp-data" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'data')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Data Display & Lists</Typography>
                            <div className="flex flex-wrap gap-4 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <div className="w-full flex gap-4">
                                    <Tooltip title="This is a tooltip" placement="top"><Chip label="Hover me (Tooltip)" color="primary" /></Tooltip>
                                    <Chip label="Secondary" color="secondary" variant="outlined" />
                                    <Chip label="Deletable" onDelete={() => {}} />
                                    <Badge badgeContent={4} color="primary">
                                        <MailIcon color="action" />
                                    </Badge>
                                </div>
                                <div className="w-full max-w-sm mt-4">
                                    <List sx={{ bgcolor: muiTheme.palette.background.default, borderRadius: 1 }}>
                                        <ListItem>
                                            <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary="Photos" secondary="Jan 9, 2014" sx={{ '& .MuiListItemText-primary': { color: muiTheme.palette.text.primary }, '& .MuiListItemText-secondary': { color: muiTheme.palette.text.secondary } }} />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><FolderIcon color="secondary" /></ListItemIcon>
                                            <ListItemText primary="Work" secondary="Jan 7, 2014" sx={{ '& .MuiListItemText-primary': { color: muiTheme.palette.text.primary }, '& .MuiListItemText-secondary': { color: muiTheme.palette.text.secondary } }} />
                                        </ListItem>
                                    </List>
                                </div>
                            </div>
                        </section>

                        <section id="comp-feedback" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'feedback')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Feedback</Typography>
                            <div className="flex flex-col gap-6 p-6 bg-paper rounded shadow-md" style={{ backgroundColor: muiTheme.palette.background.paper }}>
                                <div className="flex items-center gap-4">
                                    <CircularProgress color="primary" />
                                    <CircularProgress color="secondary" />
                                </div>
                                <div className="w-full max-w-md">
                                    <LinearProgress color="primary" sx={{ mb: 2 }} />
                                    <LinearProgress color="secondary" />
                                </div>
                                <SnackbarContent message="I love snacks." action={<Button color="secondary" size="small">Undo</Button>} />
                            </div>
                        </section>

                        <section id="comp-surfaces" className="scroll-mt-8" hidden={!filteredSections.some(s => s.id === 'surfaces')}>
                            <Typography variant="h5" color="text.primary" gutterBottom>Surfaces & Dialogs</Typography>
                            <div className="flex flex-col gap-8">
                                <AppBar position="static" color="primary">
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

                                <BottomNavigation showLabels value={0} sx={{ width: 500, bgcolor: muiTheme.palette.background.paper }}>
                                    <BottomNavigationAction label="Recents" icon={<RestoreIcon />} />
                                    <BottomNavigationAction label="Favorites" icon={<FavoriteIcon />} />
                                    <BottomNavigationAction label="Nearby" icon={<LocationOnIcon />} />
                                </BottomNavigation>

                                <Paper elevation={3} sx={{ p: 4, bgcolor: muiTheme.palette.background.paper }}>
                                    <Typography variant="h6" color="text.primary" gutterBottom>Paper Surface</Typography>
                                    <Typography color="text.secondary">This is a piece of paper resting on the surface. It uses elevation to show depth.</Typography>
                                </Paper>

                                <div className="w-full max-w-lg">
                                    <Accordion sx={{ bgcolor: muiTheme.palette.background.paper }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography color="text.primary">Accordion 1</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.</Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                    <Accordion sx={{ bgcolor: muiTheme.palette.background.paper }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography color="text.primary">Accordion 2</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography color="text.secondary">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.</Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
}
