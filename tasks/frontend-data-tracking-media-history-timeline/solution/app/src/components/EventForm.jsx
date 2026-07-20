import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Textarea, Select, MultiSelect, Button, Group } from '@mantine/core';
import { useSetAtom } from 'jotai';
import { addEventAtom, updateEventAtom } from '../store.js';
import { MT_DATA } from '../data.js';

const typeEnum = ["First Appearance", "Mass Adoption", "Standardization", "Obsoletion", "Commemoration"];

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  type: z.enum(typeEnum, { errorMap: () => ({ message: "Type must be exactly one closed-enum value" }) }),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Timestamp must end with Z in ISO-8601 format"),
  mediaRefs: z.string().min(1, "mediaRefs required").refine(val => {
    const refs = val.split(';').map(s => s.trim()).filter(Boolean);
    return refs.length >= 1 && refs.length <= 6;
  }, "MediaRefs must contain 1 to 6 entries"),
  year: z.coerce.number().int("Year must be an integer").min(-3200, "Year must be between -3200 and 2024").max(2024, "Year must be between -3200 and 2024"),
  place: z.string().trim().min(1, "Place is required").max(80, "Place is too long"),
  categories: z.array(z.string()).min(1, "Missing categories"),
  summary: z.string().trim().min(1, "Summary is required").max(2000, "Summary is too long"),
  detail: z.string().trim().min(1, "Detail is required").max(4000, "Detail is too long")
}).refine(data => {
  if (data.year >= 1) {
    return data.timestamp.startsWith(data.year.toString().padStart(4, '0'));
  } else {
    return data.timestamp === "0001-01-01T00:00:00.000Z";
  }
}, {
  message: "Timestamp year must match CE year, or be exactly 0001-01-01T00:00:00.000Z for BCE",
  path: ["timestamp"]
});

export function EventForm({ initialData, onClose }) {
  const addEvent = useSetAtom(addEventAtom);
  const updateEvent = useSetAtom(updateEventAtom);

  const defaultValues = initialData && initialData !== 'new' ? {
    ...initialData,
    mediaRefs: initialData.mediaRefs ? initialData.mediaRefs.join(';') : ''
  } : {
    title: '',
    type: 'First Appearance',
    timestamp: '1900-01-01T00:00:00.000Z',
    mediaRefs: '',
    year: 1900,
    place: '',
    categories: [],
    summary: '',
    detail: ''
  };

  const { control, handleSubmit, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  });

  const onSubmit = (data) => {
    const refs = data.mediaRefs.split(';').map(s => s.trim()).filter(Boolean);
    const payload = {
      ...data,
      mediaRefs: refs
    };

    if (initialData && initialData !== 'new') {
      updateEvent({ ...payload, id: initialData.id });
    } else {
      addEvent(payload);
    }
    onClose();
  };

  const categoryOptions = MT_DATA.categories.map(c => ({ value: c.id, label: c.label }));

  return (
    <div className="flex-1 overflow-auto bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-serif font-bold text-2xl mb-6">{initialData && initialData !== 'new' ? 'Edit event' : 'Add event'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextInput label="Title" error={errors.title?.message} {...field} />
            )}
          />

          <Group grow>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <TextInput type="number" label="Year" error={errors.year?.message} {...field} />
              )}
            />
            <Controller
              name="place"
              control={control}
              render={({ field }) => (
                <TextInput label="Place" error={errors.place?.message} {...field} />
              )}
            />
          </Group>

          <Group grow>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select label="Type" data={typeEnum} error={errors.type?.message} {...field} />
              )}
            />
            <Controller
              name="timestamp"
              control={control}
              render={({ field }) => (
                <TextInput label="Timestamp (ISO-8601 ending with Z)" error={errors.timestamp?.message} {...field} />
              )}
            />
          </Group>

          <Controller
            name="categories"
            control={control}
            render={({ field }) => (
              <MultiSelect label="Categories" data={categoryOptions} error={errors.categories?.message} {...field} />
            )}
          />

          <Controller
            name="mediaRefs"
            control={control}
            render={({ field }) => (
              <TextInput label="Media Refs (semicolon separated)" error={errors.mediaRefs?.message} {...field} />
            )}
          />

          <Controller
            name="summary"
            control={control}
            render={({ field }) => (
              <Textarea label="Summary" minRows={2} error={errors.summary?.message} {...field} />
            )}
          />

          <Controller
            name="detail"
            control={control}
            render={({ field }) => (
              <Textarea label="Detail" minRows={4} error={errors.detail?.message} {...field} />
            )}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="cyan" disabled={!isValid}>
              {initialData && initialData !== 'new' ? 'Save' : 'Add event'}
            </Button>
          </Group>
        </form>
      </div>
    </div>
  );
}
