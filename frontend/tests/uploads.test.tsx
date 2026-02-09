import { render, screen } from '@testing-library/react'
import UploadsPage from '@/app/(dashboard)/uploads/page'
import { ModalProvider } from '@/components/ui/modal/ModalProvider'
import { SWRConfig } from 'swr'

describe('UploadsPage', () => {
  it('renders page title', () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), isPaused: () => true }}>
        <ModalProvider>
          <UploadsPage />
        </ModalProvider>
      </SWRConfig>
    )
    expect(screen.getByText('Uploads')).toBeInTheDocument()
  })
})


