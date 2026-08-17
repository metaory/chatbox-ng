import { Box, Text, Title } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { SkillsSection } from '@/components/settings/skills'

export const Route = createFileRoute('/settings/skills')({
  component: RouteComponent,
})

export function RouteComponent() {

  return (
    <Box p="md">
      <Title order={5}>Skills</Title>
      <Text size="sm" c="dimmed" mt="xs">
        Enabled skills will be available in Task mode.
      </Text>
      <Box className="mt-8">
        <SkillsSection />
      </Box>
    </Box>
  )
}
