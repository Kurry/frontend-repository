import React, { useState, useRef, useEffect } from 'react';
import { editScene, toggleCheckbox } from '@/store';
import { marked } from 'marked';
import { clsx } from 'clsx';

interface SceneDescriptionProps {
    sceneId: string;
    body: string;
}

export function SceneDescription({ sceneId, body }: SceneDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(body);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditText(body);
    }, [body]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.selectionStart = textareaRef.current.value.length;
            textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (editText !== body && editText.trim().length >= 8) {
            editScene(sceneId, { body: editText });
        } else if (editText.trim().length < 8) {
            setEditText(body); // Revert on invalid
        }
    };

    const renderMarkdown = (text: string) => {
        // Custom renderer for checkboxes to make them interactive via data attributes
        const renderer = new marked.Renderer();
        renderer.listitem = (text) => {
            if (text.includes('task-list-item')) {
                 return `<li class="task-list-item">${text}</li>`;
            }
            return `<li>${text}</li>`;
        };
        renderer.checkbox = (checked) => {
            return `<input type="checkbox" aria-label="Toggle checklist item" role="checkbox" aria-checked="${checked}" class="scene-checkbox" ${checked ? 'checked' : ''} />`;
        };

        marked.setOptions({ renderer });
        return { __html: marked.parse(text) as string };
    };

    const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).classList.contains('scene-checkbox')) {
            const checkbox = e.target as HTMLInputElement;
            // Find the line in the markdown and toggle it
            const lines = body.split('\n');
            let checkboxCount = 0;
            const newLines = lines.map(line => {
                const match = line.match(/^(\s*-\s*\[)([ xX])(\]\s+.*)/);
                if (match) {
                    if (checkboxCount === Array.from(document.querySelectorAll(`[data-scene-id="${sceneId}"] .scene-checkbox`)).indexOf(checkbox)) {
                        return `${match[1]}${checkbox.checked ? 'x' : ' '}${match[3]}`;
                    }
                    checkboxCount++;
                }
                return line;
            });
            toggleCheckbox(sceneId, newLines.join('\n'));
            e.stopPropagation();
        } else {
            setIsEditing(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
            setIsEditing(true);
            e.preventDefault();
        }
    };

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                className="w-full h-full min-h-[100px] p-2 text-sm bg-yellow-50 border-2 border-dashed border-yellow-400 focus:outline-none resize-none scene-description is-editing"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setEditText(body);
                        setIsEditing(false);
                    }
                }}
            />
        );
    }

    return (
        <div
            className="scene-description prose prose-sm max-w-none cursor-pointer hover:bg-yellow-50/50 p-2 -mx-2 rounded transition-colors focus:ring-2 focus:ring-yellow-400"
            tabIndex={0}
            onClick={handleContentClick}
            onFocus={() => setIsEditing(true)}
            onKeyDown={handleKeyDown}
            data-scene-id={sceneId}
            dangerouslySetInnerHTML={renderMarkdown(body)}
            role="button"
            aria-label="Edit scene description"
        />
    );
}
