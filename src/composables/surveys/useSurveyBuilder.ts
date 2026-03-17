import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { surveyService } from '@/services/survey.service'
import type { IQuestion } from '@/types/survey'

export function useSurveyBuilder(surveyId?: string) {
  const router = useRouter()

  const title = ref('')
  const description = ref('')
  const questions = ref<IQuestion[]>([])
  const currentStatus = ref<'draft' | 'active' | 'closed'>('draft')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref('')
  const successMsg = ref('')

  const isEditMode = computed(() => !!surveyId)
  const isDraft = computed(() => currentStatus.value === 'draft')
  const canEdit = computed(() => !isEditMode.value || isDraft.value)

  async function loadSurvey() {
    if (!surveyId) return
    isLoading.value = true
    try {
      const res = await surveyService.getSurvey(surveyId)
      const s = res.survey
      title.value = s.title
      description.value = s.description ?? ''
      questions.value = s.questions.map((q) => ({ ...q }))
      currentStatus.value = s.status
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
      if (
        ['multiple_choice', 'checkbox', 'dropdown'].includes(q.type) &&
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
        questions: questions.value,
      }
      if (isEditMode.value) {
        await surveyService.updateSurvey(surveyId!, payload)
        successMsg.value = 'Encuesta guardada como borrador.'
      } else {
        const res = await surveyService.createSurvey(payload)
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
