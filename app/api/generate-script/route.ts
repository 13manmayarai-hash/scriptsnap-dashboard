import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, duration, category, tone } = body

    // Generate a more realistic script based on duration and tone
    const durationSeconds = parseInt(duration) || 60
    const wordCount = Math.floor(durationSeconds * 2.5) // ~150 words per 60 seconds

    // Generate opening hook
    const hooks = [
      `Did you know? ${topic} is more fascinating than you think!`,
      `Wait until you see this... ${topic} will blow your mind!`,
      `Let me tell you something incredible about ${topic}.`,
      `You've probably never heard this about ${topic}...`,
      `Here's a mind-bending fact about ${topic}!`,
    ]

    const hook = hooks[Math.floor(Math.random() * hooks.length)]

    // Generate main content based on tone
    let mainContent = ''
    if (tone === 'Meditative') {
      mainContent = `In our fast-paced world, ${topic} teaches us valuable lessons about patience and perspective. When we take time to truly understand ${topic}, we discover unexpected connections. It reminds us that everything has depth and beauty when we look closer. This is why so many people are now exploring ${topic} more deeply.`
    } else if (tone === 'Energetic') {
      mainContent = `Here's the thing about ${topic} that everyone needs to know! It's absolutely game-changing. People are buzzing about ${topic} everywhere right now, and here's why it matters. The impact is HUGE. Once you understand ${topic}, you'll see everything differently. This is genuinely one of the most exciting developments!`
    } else {
      // Balanced
      mainContent = `${topic} is an interesting topic that affects many people. Let's break down what makes it important. First, there are several key aspects to understand. Second, the practical applications are significant. And third, the long-term implications are worth considering. Whether you're new to ${topic} or already familiar with it, there's always something new to learn.`
    }

    // Generate closing
    const closings = [
      `That's why ${topic} matters more than ever.`,
      `Now you understand the real story behind ${topic}.`,
      `This is what makes ${topic} so special.`,
      `Remember this next time you think about ${topic}.`,
      `Share this with someone who needs to know about ${topic}!`,
    ]

    const closing = closings[Math.floor(Math.random() * closings.length)]

    // Combine into full script
    const script = `${hook} ${mainContent} ${closing}`

    // Generate description
    const description = `Explore the fascinating world of ${topic} in this ${durationSeconds}-second journey. Perfect for YouTube Shorts. Learn something new about ${category.toLowerCase()}.`

    // Generate hashtags based on category
    const hashtagMap: Record<string, string[]> = {
      'Cultural & Historical': ['#Culture', '#History', '#Educational'],
      'Art & Design': ['#Art', '#Design', '#Creative'],
      'Science & Nature': ['#Science', '#Nature', '#Learning'],
      'Fashion & Style': ['#Fashion', '#Style', '#Trending'],
      'Food & Craft': ['#Food', '#Recipe', '#DIY'],
      'Tech & Engineering': ['#Tech', '#Innovation', '#Engineering'],
    }

    const hashtags = hashtagMap[category] || ['#Shorts', '#YouTube', '#Learning']

    // Generate pinned comment
    const pinnedComment = `What did you think about ${topic}? Let us know in the comments!`

    return NextResponse.json({
      title: `Discover ${topic}`,
      script,
      description,
      hashtags,
      pinnedComment,
      wordCount: script.split(' ').length,
      estimatedDuration: durationSeconds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}
