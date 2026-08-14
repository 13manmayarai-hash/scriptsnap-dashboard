import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, duration, category, tone } = body

    const demoScript = {
      id: Math.random().toString(36).substr(2, 9),
      topic,
      duration,
      category,
      tone,
      script: `Today we're exploring ${topic}. This is a ${duration}-second journey through ${category.toLowerCase()} in a ${tone.toLowerCase()} tone.`,
      title: `Discover ${topic}`,
      description: `Learn about ${topic} in this engaging short-form video. Perfect for YouTube Shorts.`,
      hashtags: ['#Shorts', '#YouTube', '#Educational'],
      pinned_comment: 'What did you think? Let us know in the comments!',
      alternativeTitles: [
        { style: 'Curious', title: `Wait, did you know about ${topic}?` },
        { style: 'ASMR', title: `Relaxing ${topic} guide` },
        { style: 'Clickbait', title: `${topic} WILL BLOW YOUR MIND` },
      ],
      word_count: 45,
      created_at: new Date().toISOString(),
      is_series: false,
    }

    return NextResponse.json({ script: demoScript }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
