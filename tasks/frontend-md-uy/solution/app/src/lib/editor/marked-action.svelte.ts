import { marked } from 'marked';
import * as Y from 'yjs';

const generateHTML = (content: string) => {
	return marked.use({ gfm: true, breaks: true }).parse(content) as string;
};

export const markedAction = (node: HTMLElement, { ytext }: { ytext: Y.Text }) => {
	node.innerHTML = generateHTML(ytext.toString());

	const observer = () => {
		node.innerHTML = generateHTML(ytext.toString());
	};
	ytext.observe(observer);

	return {
		destroy: () => ytext.unobserve(observer)
	};
};
