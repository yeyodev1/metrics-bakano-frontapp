import type { SalesBookingForm } from './salesExecutive.service'
import { shallowRef } from 'vue'

export const selectedForm = shallowRef<SalesBookingForm | null>(null)
