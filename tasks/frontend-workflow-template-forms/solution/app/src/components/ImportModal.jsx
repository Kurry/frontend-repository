import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileUploaderDropContainer, Modal, TextArea } from '@carbon/react'
import { z } from 'zod'
import { libraryDocumentSchema } from '../domain'
import { useStudioStore } from '../store'

const importSchema = z.object({
  documentText: z.string().min(1, 'Library JSON is required. Paste JSON or choose a file.'),
}).superRefine((value, context) => {
  try {
    const document = JSON.parse(value.documentText)
    const parsed = libraryDocumentSchema.safeParse(document)
    if (!parsed.success) {
      context.addIssue({ code: 'custom', path: ['documentText'], message: 'Library JSON does not match the Template Forms schema.' })
    }
  } catch {
    context.addIssue({ code: 'custom', path: ['documentText'], message: 'Library JSON is malformed. Check its syntax and try again.' })
  }
})

export default function ImportModal() {
  const open = useStudioStore((state) => state.importModalOpen)
  const setChrome = useStudioStore((state) => state.setChrome)
  const replaceLibrary = useStudioStore((state) => state.replaceLibrary)
  const showToast = useStudioStore((state) => state.showToast)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(importSchema),
    mode: 'onChange',
    defaultValues: { documentText: '' },
  })

  useEffect(() => {
    if (!open) reset({ documentText: '' })
  }, [open, reset])

  function close() {
    setChrome({ importModalOpen: false })
  }

  function confirm({ documentText }) {
    try {
      const document = libraryDocumentSchema.parse(JSON.parse(documentText))
      replaceLibrary(document.entries)
      close()
      showToast('success', 'Library imported', `${document.entries.length} prompts restored from the validated document.`)
    } catch (error) {
      showToast('error', 'Import failed', 'The document contains invalid schema properties.')
    }
  }

  async function addFile(_event, { addedFiles }) {
    const file = addedFiles?.[0]
    if (!file) return
    const text = await file.text()
    setValue('documentText', text, { shouldDirty: true, shouldValidate: true })
    await trigger('documentText')
  }

  return (
    <Modal focusTrap={true}
      open={open}
      modalHeading="Import library JSON"
      modalLabel="Validated replacement"
      primaryButtonText="Replace library"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid}
      onRequestSubmit={handleSubmit(confirm)}
      onRequestClose={close}
      size="md"
    >
      <p className="modal-copy">Importing a conforming Template Forms document replaces the current in-memory library. Invalid files leave it unchanged.</p>
      <FileUploaderDropContainer
        id="library-json-file"
        accept={['application/json', '.json']}
        labelText="Choose template-library.json"
        multiple={false}
        onAddFiles={addFile}
      />
      <div className="import-divider"><span>or paste JSON</span></div>
      <TextArea
        id="import-document-text"
        labelText={<>Library document <span className="required-mark" aria-hidden="true">*</span></>}
        rows={10}
        placeholder={'{\n  "schemaVersion": 1,\n  "product": "Template Forms",\n  ...\n}'}
        invalid={Boolean(errors.documentText)}
        invalidText={errors.documentText?.message}
        {...register('documentText')}
      />
    </Modal>
  )
}
