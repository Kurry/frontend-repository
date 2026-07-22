import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, TextInput } from '@carbon/react'
import { z } from 'zod'
import { savePayloadSchema, techniqueById, titleSchema } from '../domain'
import { useStudioStore } from '../store'

const schema = z.object({ title: titleSchema })

export default function SaveModal({ launcherButtonRef }) {
  const open = useStudioStore((state) => state.saveModalOpen)
  const technique = useStudioStore((state) => state.activeTechnique)
  const draft = useStudioStore((state) => state.drafts[technique])
  const promptText = useStudioStore((state) => state.prompts[technique])
  const setChrome = useStudioStore((state) => state.setChrome)
  const saveCurrent = useStudioStore((state) => state.saveCurrent)
  const showToast = useStudioStore((state) => state.showToast)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { title: `${techniqueById[technique].name} prompt` },
  })

  useEffect(() => {
    if (open) {
      setSubmitting(false)
      reset({ title: `${techniqueById[technique].name} prompt` })
      requestAnimationFrame(() => trigger())
    }
  }, [open, reset, technique, trigger])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = document.querySelector('[role="dialog"]')
      if (!dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    setChrome({ saveModalOpen: false })
    requestAnimationFrame(() => launcherButtonRef.current?.focus())
  }

  function confirm({ title }) {
    if (submitting) return
    const payload = {
      title: title.trim(),
      technique,
      fields: draft.fields,
      promptText,
      ...(draft.attachments.length ? { attachments: draft.attachments } : {}),
    }
    const parsed = savePayloadSchema.safeParse(payload)
    if (!parsed.success || parsed.data.technique !== technique || parsed.data.promptText !== promptText) return
    setSubmitting(true)
    const saved = saveCurrent(parsed.data.title)
    if (saved) {
      showToast('success', 'Saved to library', `“${saved.title}” is ready in your library.`)
      requestAnimationFrame(() => launcherButtonRef.current?.focus())
    }
    setTimeout(() => { setSubmitting(false) }, 300)
  }

  if (!open) return null

  return (
    <Modal
      open
      modalHeading="Save prompt to library"
      modalLabel={techniqueById[technique].name}
      primaryButtonText="Save prompt"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || submitting}
      onRequestSubmit={handleSubmit(confirm)}
      onRequestClose={close}
      onSecondarySubmit={close}
      shouldSubmitOnEnter
      size="sm"
      className="scale-modal"
      selectorPrimaryFocus="#library-title"
    >
      <p className="modal-copy">Give this prompt a clear name so it is easy to find and reuse later.</p>
      <TextInput
        id="library-title"
        data-modal-primary-focus
        labelText="Title"
        placeholder="Name this prompt"
        invalid={Boolean(errors.title)}
        invalidText={errors.title?.message}
        {...register('title')}
      />
    </Modal>
  )
}
