import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import type { IQuestion } from '@/types/survey'

export function useSurveyBuilder(surveyId?: string) {
  const router = useRouter()

  const title = ref('')
  const description = ref('')
  const coverImage = ref('')
  const questions = ref<IQuestion[]>([])
  const currentStatus = ref<'draft' | 'active' | 'closed'>('draft')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const successMsg = ref('')

  const isEditMode = computed(() => !!surveyId)
  const isDraft = computed(() => currentStatus.value === 'draft')
  const canEdit = computed(() => true)

  // ── Cache ─────────────────────────────────────────────────────
  const CACHE_KEY = surveyId ? `survey_draft_${surveyId}` : 'survey_draft_new'
  let _cacheTimer: ReturnType<typeof setTimeout> | null = null

  function saveToCache() {
    if (_cacheTimer) clearTimeout(_cacheTimer)
    _cacheTimer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          title: title.value,
          description: description.value,
          coverImage: coverImage.value,
          questions: questions.value,
        }))
      } catch { /* storage full — silently ignore */ }
    }, 600)
  }

  function restoreFromCache(): boolean {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return false
      const draft = JSON.parse(raw)
      title.value       = draft.title       ?? ''
      description.value = draft.description ?? ''
      coverImage.value  = draft.coverImage  ?? ''
      questions.value   = draft.questions   ?? []
      return true
    } catch {
      return false
    }
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY)
  }

  // Auto-save to localStorage on every change (debounced 600ms)
  watch([title, description, coverImage, questions], saveToCache, { deep: true })

  // ── Load ──────────────────────────────────────────────────────
  async function loadSurvey() {
    if (!surveyId) {
      // New survey: restore any cached draft
      restoreFromCache()
      return
    }
    isLoading.value = true
    try {
      const res = await surveyService.getSurvey(surveyId)
      const s = res.survey
      title.value       = s.title
      description.value = s.description ?? ''
      coverImage.value  = s.coverImage  ?? ''
      questions.value   = s.questions.map((q) => ({ ...q }))
      currentStatus.value = s.status
      // Overlay unsaved local changes if they exist (user reloaded mid-edit)
      if (s.status === 'draft') restoreFromCache()
    } catch (err: any) {
      error.value = err?.message || 'Error al cargar la encuesta.'
    } finally {
      isLoading.value = false
    }
  }

  function generateId(): string {
    return Math.random().toString(36).slice(2, 10)
  }

  function removeQuestion(idx: number) {
    questions.value.splice(idx, 1)
  }

  function moveUp(idx: number) {
    if (idx <= 0) return
    const [removed] = questions.value.splice(idx, 1)
    if (removed) {
      questions.value.splice(idx - 1, 0, removed)
    }
  }

  function moveDown(idx: number) {
    if (idx >= questions.value.length - 1) return
    const [removed] = questions.value.splice(idx, 1)
    if (removed) {
      questions.value.splice(idx + 1, 0, removed)
    }
  }

  function onTypeChange(q: IQuestion) {
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)) {
      if (!q.options || q.options.length === 0) q.options = ['Opción 1']
    } else {
      q.options = []
    }
    if (q.type === 'rating') {
      q.min = 1
      q.max = 5
    }
    if (q.type === 'nps') {
      q.min = 0
      q.max = 10
    }
    if (q.type === 'image_question') {
      if (!q.imageAnswerType) q.imageAnswerType = 'yes_no'
      if (['multiple_choice', 'checkbox', 'dropdown'].includes(q.imageAnswerType)) {
        if (!q.options || q.options.length === 0) q.options = ['Opción 1']
      }
    }
  }

  function addOption(q: IQuestion) {
    if (!q.options) q.options = []
    q.options.push(`Opción ${q.options.length + 1}`)
  }

  function removeOption(q: IQuestion, idx: number) {
    q.options?.splice(idx, 1)
  }

  function validate(): boolean {
    if (!title.value.trim()) {
      error.value = 'El título es requerido.'
      return false
    }
    if (questions.value.length === 0) {
      error.value = 'Agrega al menos una pregunta.'
      return false
    }
    for (const q of questions.value) {
      if (!q.label.trim()) {
        error.value = 'Todas las preguntas deben tener un texto.'
        return false
      }
      const effectiveOptionsType = q.type === 'image_question'
        ? q.imageAnswerType
        : q.type
      if (
        ['multiple_choice', 'checkbox', 'dropdown'].includes(effectiveOptionsType ?? '') &&
        (!q.options || q.options.length < 2)
      ) {
        error.value = 'Las preguntas de opciones deben tener al menos 2 opciones.'
        return false
      }
    }
    return true
  }

  async function addQuestion() {
    questions.value.push({
      id: generateId(),
      type: 'short_text',
      label: '',
      required: false,
      options: [],
    })
    await nextTick()
    const cards = document.querySelectorAll('.question-card')
    cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function saveAsDraft() {
    if (!validate()) return
    isSaving.value = true
    error.value = ''
    try {
      const payload = {
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        coverImage: coverImage.value || undefined,
        questions: questions.value,
      }
      if (isEditMode.value) {
        await surveyService.updateSurvey(surveyId!, payload)
        clearCache()
        successMsg.value = currentStatus.value === 'draft'
          ? 'Encuesta guardada como borrador.'
          : 'Cambios guardados correctamente.'
      } else {
        const res = await surveyService.createSurvey(payload)
        clearCache()
        successMsg.value = 'Encuesta creada como borrador.'
        router.replace({ name: 'SurveyEdit', params: { surveyId: res.survey._id } })
      }
      setTimeout(() => {
        successMsg.value = ''
      }, 3000)
    } catch (err: any) {
      error.value = err?.message || 'Error al guardar.'
    } finally {
      isSaving.value = false
    }
  }

  async function activate() {
    if (!validate()) return
    isSaving.value = true
    error.value = ''
    try {
      const payload = {
        title: title.value.trim(),
        description: description.value.trim() || undefined,
        coverImage: coverImage.value || undefined,
        questions: questions.value,
      }
      let currentId = surveyId
      if (isEditMode.value) {
        await surveyService.updateSurvey(currentId!, payload)
      } else {
        const res = await surveyService.createSurvey(payload)
        currentId = res.survey._id
      }
      await surveyService.updateSurveyStatus(currentId!, 'active')
      clearCache()
      successMsg.value = 'Encuesta activada correctamente.'
      setTimeout(() => {
        router.push({ name: 'SurveyList' })
      }, 1500)
    } catch (err: any) {
      error.value = err?.message || 'Error al activar.'
    } finally {
      isSaving.value = false
    }
  }

  return {
    title,
    description,
    coverImage,
    questions,
    currentStatus,
    isLoading,
    isSaving,
    error,
    successMsg,
    isEditMode,
    isDraft,
    canEdit,
    loadSurvey,
    addQuestion,
    removeQuestion,
    moveUp,
    moveDown,
    onTypeChange,
    addOption,
    removeOption,
    saveAsDraft,
    activate,
  }
}
