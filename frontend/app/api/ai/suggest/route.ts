import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Context is required' },
        { status: 400 }
      )
    }

    // For now, return fallback suggestions without OpenAI
    // In production, you would use OpenAI API here
    const fallbackSuggestions = context.fields.map((field: any) => {
      let value = ""
      const fieldName = field.name.toLowerCase()
      
      if (fieldName.includes('title')) {
        value = "Q4 Marketing Campaign"
      } else if (fieldName.includes('description')) {
        value = "Engaging content for our target audience"
      } else if (fieldName.includes('channel')) {
        value = "Social Media"
      } else if (fieldName.includes('priority')) {
        value = "MEDIUM"
      } else if (fieldName.includes('status')) {
        value = "TODO"
      } else if (fieldName.includes('name')) {
        value = "Marketing Initiative"
      } else if (fieldName.includes('email')) {
        value = "info@marketingkreis.ch"
      } else if (fieldName.includes('phone')) {
        value = "+41 44 123 4567"
      } else {
        value = `Sample ${field.name}`
      }
      
      return { field: field.name, value }
    })

    return NextResponse.json({
      suggestions: fallbackSuggestions,
      message: "AI suggestions generated successfully (fallback mode)"
    })

  } catch (error) {
    console.error('AI API Error:', error)
    
    // Return basic fallback suggestions
    const fallbackSuggestions = [
      { field: "title", value: "Marketing Campaign" },
      { field: "description", value: "Professional content for Swiss market" },
      { field: "channel", value: "LinkedIn" }
    ]

    return NextResponse.json({
      suggestions: fallbackSuggestions,
      message: "Fallback suggestions provided"
    })
  }
}














