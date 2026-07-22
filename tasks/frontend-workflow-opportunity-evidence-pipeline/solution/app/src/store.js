import { createStore } from 'solid-js/store';
import { initialProfile, initialOpportunities } from './fixtures';

const [state, setState] = createStore({
  profile: initialProfile,
  opportunities: initialOpportunities,
  selectedOpportunityId: initialOpportunities[0].id,
  viewMode: 'lattice' // lattice, composer, review, snapshots
});

export { state, setState };

export const resetStore = () => {
    setState({
        profile: JSON.parse(JSON.stringify(initialProfile)),
        opportunities: JSON.parse(JSON.stringify(initialOpportunities)),
        selectedOpportunityId: initialOpportunities[0].id,
        viewMode: 'lattice'
    });
};
