import { render, screen } from '@testing-library/react'
import UploadsPage from '@/app/(dashboard)/uploads/page'

describe('UploadsPage', () => {
  it('renders page title', () => {
    render(<UploadsPage />)
    expect(screen.getByText('Uploads')).toBeInTheDocument()
  })
})


