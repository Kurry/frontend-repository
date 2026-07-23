import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Drawer, Group, Modal, SegmentedControl, Stack, Text, Textarea, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Controller, useForm } from 'react-hook-form';
import { IconBraces, IconCheck, IconClipboard, IconDownload, IconFileImport, IconPackageExport, IconPrinter } from '@tabler/icons-react';
import { buildReviewPackage, portfolioSummaryMarkdown, reviewPackageJson } from '../exporters';
import { importFormSchema } from '../schemas';
import { useReviewStore } from '../store';

export function ArtifactDrawers() {
  const bundles = useReviewStore((state) => state.bundles);
  const ui = useReviewStore((state) => state.ui);
  const setExportOpen = useReviewStore((state) => state.setExportOpen);
  const setExportFormat = useReviewStore((state) => state.setExportFormat);
  const setExportPreviewText = useReviewStore((state) => state.setExportPreviewText);
  const setImportOpen = useReviewStore((state) => state.setImportOpen);
  const setImportDraft = useReviewStore((state) => state.setImportDraft);
  const importPackage = useReviewStore((state) => state.importPackage);
  const setAnnouncement = useReviewStore((state) => state.setAnnouncement);
  const preview = useMemo(() => ui.exportFormat === 'json' ? reviewPackageJson(bundles, ui.exportGeneratedAt) : portfolioSummaryMarkdown(bundles, ui.exportGeneratedAt), [bundles, ui.exportFormat, ui.exportGeneratedAt]);
  const { control, handleSubmit, setError, clearErrors, reset, formState: { errors, isSubmitting } } = useForm<{ packageText: string }>({ resolver: zodResolver(importFormSchema), defaultValues: { packageText: ui.importDraft } });
  useEffect(() => setExportPreviewText(preview), [preview, setExportPreviewText]);
  useEffect(() => { if (ui.importOpen) reset({ packageText: ui.importDraft }); }, [ui.importOpen, ui.importDraft, reset]);

  const copy = async () => {
    if (ui.exportFormat === 'json') buildReviewPackage(bundles, ui.exportGeneratedAt);
    await navigator.clipboard.writeText(preview);
    setAnnouncement('Export preview copied.');
    notifications.show({ title: 'Preview copied', message: 'The exact visible preview text is on the clipboard.', color: 'teal', icon: <IconCheck size={16} /> });
  };
  const download = () => {
    if (ui.exportFormat === 'json') buildReviewPackage(bundles, ui.exportGeneratedAt);
    const blob = new Blob([preview], { type: ui.exportFormat === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ui.exportFormat === 'json' ? 'review-certification-package.json' : 'review-summary.md';
    anchor.click();
    URL.revokeObjectURL(url);
    setAnnouncement('Export download started.');
    notifications.show({ title: 'Download started', message: anchor.download, color: 'teal', icon: <IconDownload size={16} /> });
  };
  const submitImport = ({ packageText }: { packageText: string }) => {
    clearErrors('packageText');
    const result = importPackage(packageText);
    if (!result.ok) {
      setError('packageText', { message: result.error });
      return;
    }
    setAnnouncement('Certification package imported.');
    notifications.show({ title: 'Package imported', message: 'Portfolio and bundle session facets now match the imported document.', color: 'teal', icon: <IconCheck size={16} /> });
  };
  const loadLiveJson = () => {
    const liveJson = reviewPackageJson(bundles, new Date().toISOString());
    setImportDraft(liveJson);
    reset({ packageText: liveJson });
    clearErrors('packageText');
    setAnnouncement('Current live Review Package JSON loaded into the import editor.');
  };
  return (
    <>
      <Drawer
        opened={ui.exportOpen}
        transitionProps={{ transition: 'slide-left', duration: 250 }}
        onClose={() => setExportOpen(false)}
        position="right"
        size="min(760px, 94vw)"
        title={<div><Text className="eyebrow">Live Store Artifact</Text><Title order={2}>Export Certification Package</Title></div>}
        overlayProps={{ backgroundOpacity: 0.35, blur: 2 }}
        closeButtonProps={{ 'aria-label': 'Close export drawer' }}
        trapFocus
        returnFocus
      >
        <Stack gap="md" className="export-drawer-content">
          <SegmentedControl fullWidth value={ui.exportFormat} onChange={(value) => setExportFormat(value as 'json' | 'markdown')} data={[{ value: 'json', label: 'Review Package JSON' }, { value: 'markdown', label: 'Review Summary Markdown' }]} />
          <Group justify="space-between"><Text size="sm" c="dimmed">Preview regenerates from live session state.</Text><Text size="xs" fw={700}>{preview.length.toLocaleString()} characters</Text></Group>
          <pre className="artifact-preview" aria-label={`${ui.exportFormat} export preview`}>{preview}</pre>
          <Group justify="space-between" className="artifact-actions">
            <Button variant="subtle" leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>Print summary</Button>
            <Group><Button variant="default" leftSection={<IconClipboard size={16} />} onClick={copy}>Copy</Button><Button leftSection={<IconDownload size={16} />} onClick={download}>Download</Button></Group>
          </Group>
        </Stack>
      </Drawer>
      <Modal
        opened={ui.importOpen}
        transitionProps={{ transition: 'pop', duration: 250 }}
        onClose={() => setImportOpen(false)}
        size="lg"
        title={<div><Text className="eyebrow">Review Package JSON</Text><Title order={2}>Import Certification Package</Title></div>}
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
        closeButtonProps={{ 'aria-label': 'Close import dialog' }}
        trapFocus
        returnFocus
        withinPortal
      >
        <form onSubmit={handleSubmit(submitImport)} className="import-form">
          <Text size="sm" c="dimmed">Paste a complete <code>review-certification/v1</code> document. Invalid attempts do not mutate the portfolio.</Text>
          <Group mt="md" mb="xs" justify="space-between">
            <SegmentedControl value="json" data={[{ value: 'json', label: 'Review Package JSON' }]} />
            <Text size="xs" fw={700}>{ui.importDraft.length.toLocaleString()} characters</Text>
          </Group>
          <div className="artifact-preview import-preview" style={{ margin: '0 0 16px', padding: 0, overflow: 'auto' }}>
            <Controller
              name="packageText"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  classNames={{ input: 'import-textarea' }}
                  styles={{ input: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', border: 0, background: 'transparent', minHeight: 280 } }}
                  minRows={14}
                  maxRows={20}
                  label="packageText"
                  placeholder={'{\n  "schemaVersion": "review-certification/v1",\n  …\n}'}
                  error={errors.packageText?.message}
                  onChange={(event) => { field.onChange(event); setImportDraft(event.currentTarget.value); }}
                />
              )}
            />
          </div>
          <Group justify="flex-end" mt="md">
            <Button type="button" variant="light" leftSection={<IconBraces size={16} />} onClick={loadLiveJson}>Load current JSON</Button>
            <Button type="button" variant="default" leftSection={<IconClipboard size={16} />} onClick={async () => {
              await navigator.clipboard.writeText(ui.importDraft);
              setAnnouncement('Import draft copied.');
              notifications.show({ title: 'Import draft copied', message: 'The exact JSON in the editor is on the clipboard.', color: 'teal', icon: <IconCheck size={16} /> });
            }}>Copy</Button>
            <Button type="button" variant="default" leftSection={<IconDownload size={16} />} onClick={() => {
              const blob = new Blob([ui.importDraft || '{}'], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'import-draft.json';
              anchor.click();
              URL.revokeObjectURL(url);
            }}>Download</Button>
            <Button type="button" variant="default" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} leftSection={<IconFileImport size={16} />}>Import Certification Package</Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}

export function ArtifactButtons() {
  const setExportOpen = useReviewStore((state) => state.setExportOpen);
  const setImportOpen = useReviewStore((state) => state.setImportOpen);
  return (
    <Group gap="xs">
      <Button variant="default" leftSection={<IconFileImport size={16} />} onClick={() => setImportOpen(true)}>Import Certification Package</Button>
      <Button leftSection={<IconPackageExport size={16} />} onClick={() => setExportOpen(true)}>Export Certification Package</Button>
    </Group>
  );
}
