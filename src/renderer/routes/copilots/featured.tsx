import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/copilots/featured')({
  beforeLoad: () => {
    throw redirect({ to: '/copilots' })
  },
})
