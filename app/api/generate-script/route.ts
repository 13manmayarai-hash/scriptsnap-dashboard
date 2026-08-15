import { NextRequest, NextResponse } from 'next/server'

function generateDetailedScript(topic: string, duration: number, category: string, tone: string) {
  const wordCount = Math.floor(duration * 2.5) // ~150 words per 60 seconds
  const sections = Math.ceil(duration / 15) // 1 section per 15 seconds minimum

  // Generate hook (5-10 seconds)
  const hooks = [
    `Wait, you NEED to know this about ${topic}!`,
    `Let me show you something incredible about ${topic}.`,
    `Have you ever wondered about ${topic}? Here's the truth.`,
    `${topic} is way more interesting than you think.`,
    `This will completely change how you see ${topic}.`,
  ]
  const hook = hooks[Math.floor(Math.random() * hooks.length)]

  // Generate 3-5 key sections based on duration
  const sections_content = []

  if (duration >= 20) {
    sections_content.push({
      title: 'What is it?',
      content: `First, let's talk about ${topic} itself. ${topic} is fascinating because it combines multiple elements. It's not just one thing - there are layers to it. When most people think about ${topic}, they only see the surface. But when you dig deeper, you realize there's so much more. The real story of ${topic} is actually quite surprising.`,
    })
  }

  if (duration >= 35) {
    sections_content.push({
      title: 'Why does it matter?',
      content: `Here's why ${topic} is actually important. It affects more people than you'd think. In today's world, ${topic} has become increasingly relevant. People are paying attention to ${topic} now more than ever before. The reasons are compelling. Whether you realize it or not, ${topic} impacts your daily life in ways you might not have considered. Understanding ${topic} gives you an advantage.`,
    })
  }

  if (duration >= 50) {
    sections_content.push({
      title: 'How does it work?',
      content: `Let me break down how ${topic} actually works. It's simpler than you might think, but also more complex. The mechanics of ${topic} involve several key components working together. First, there's the basic principle. Second, there are supporting factors. Third, there are advanced considerations. When you understand these elements, ${topic} makes perfect sense. It's like a puzzle where every piece is essential.`,
    })
  }

  if (duration >= 65) {
    sections_content.push({
      title: 'Practical applications',
      content: `Now, how can you actually USE ${topic}? This is where it gets practical. There are multiple ways to apply ${topic} in real life. Some applications are obvious, while others are more clever. You can use ${topic} to achieve better results. Many successful people leverage ${topic} in their work. The possibilities are truly endless. Once you start thinking about ${topic} this way, you'll find opportunities everywhere.`,
    })
  }

  if (duration >= 80) {
    sections_content.push({
      title: 'Common misconceptions',
      content: `There are some myths about ${topic} that I need to clear up. Many people believe things about ${topic} that simply aren't true. Misconception number one: people think ${topic} is too complicated. That's wrong. Another common myth: people assume ${topic} doesn't apply to them. Also incorrect. The truth about ${topic} is much simpler and more empowering. Don't fall for these misconceptions.`,
    })
  }

  // Build full script
  let fullScript = hook + '\n\n'

  sections_content.forEach((section, i) => {
    fullScript += `[${section.title} - ~${Math.floor(duration / sections_content.length)}s]\n${section.content}\n\n`
  })

  // Strong closing
  const closings = [
    `That's why ${topic} matters. Now you're equipped with real knowledge.`,
    `See? ${topic} is actually incredible when you understand it.`,
    `You now have insights about ${topic} that most people don't have.`,
    `Remember this next time someone talks about ${topic}.`,
    `Share this knowledge about ${topic} with others. Spread the word!`,
  ]
  const closing = closings[Math.floor(Math.random() * closings.length)]
  fullScript += closing

  return fullScript
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, duration, category, tone } = body

    const durationSeconds = parseInt(duration) || 60

    // Generate proper length script
    const fullScript = generateDetailedScript(topic, durationSeconds, category, tone)

    // Generate description
    const description = `📍 Watch this ${durationSeconds}-second deep dive into ${topic}
🎯 Category: ${category}
🎭 Tone: ${tone}
✨ Perfect for YouTube Shorts

Learn the fascinating details about ${topic}. From basics to advanced insights, this video covers everything you need to know. You'll discover why ${topic} matters and how to apply this knowledge. Don't miss this eye-opening exploration!`

    // Generate hashtags based on category
    const hashtagMap: Record<string, string[]> = {
      'Cultural & Historical': ['#Culture', '#History', '#Educational', '#Learning'],
      'Art & Design': ['#Art', '#Design', '#Creative', '#Inspiration'],
      'Science & Nature': ['#Science', '#Nature', '#Discovery', '#Knowledge'],
      'Fashion & Style': ['#Fashion', '#Style', '#Trending', '#Lifestyle'],
      'Food & Craft': ['#Food', '#Recipe', '#DIY', '#Cooking'],
      'Tech & Engineering': ['#Tech', '#Innovation', '#Engineering', '#Future'],
    }

    const hashtags = hashtagMap[category] || ['#Shorts', '#YouTube', '#Learning', '#Explore']

    // Generate alternative titles
    const alternativeTitles = [
      { style: 'Curious', title: `The Surprising Truth About ${topic}` },
      { style: 'Energetic', title: `${topic}?! THIS IS INSANE!` },
      { style: 'Educational', title: `Complete Guide to ${topic} in ${durationSeconds}s` },
      { style: 'Mysterious', title: `What You DON'T Know About ${topic}` },
      { style: 'Mindful', title: `Understanding ${topic}: A Journey` },
      { style: 'List', title: `7 Mind-Blowing Facts About ${topic}` },
      { style: 'Comparison', title: `${topic}: Then vs Now (You Won't Believe The Difference)` },
      { style: 'Question', title: `Why Everyone Is Talking About ${topic}` },
      { style: 'Story', title: `How ${topic} Changed Everything` },
      { style: 'Quick Tip', title: `The ONE Thing You Need to Know About ${topic}` },
    ]

    // Generate key points
    const keyPoints = [
      `${topic} is more complex and fascinating than most people realize`,
      `Understanding ${topic} can significantly change your perspective`,
      `There are multiple practical applications of ${topic} in daily life`,
      `Many common beliefs about ${topic} are actually misconceptions`,
      `${topic} is increasingly relevant in today's world`,
    ]

    // Generate pinned comment
    const pinnedComments = [
      `Which fact about ${topic} surprised you the most? Drop it in the comments! 👇`,
      `Have you experienced ${topic}? Share your story below! 💬`,
      `What would YOU like to learn next about ${topic}? Comment now! 🔔`,
      `Don't forget to LIKE and SUBSCRIBE for more about ${category.toLowerCase()}!`,
      `Tag someone who needs to know this about ${topic}! 👇`,
    ]

    const pinned_comment = pinnedComments[Math.floor(Math.random() * pinnedComments.length)]

    return NextResponse.json({
      id: `script_${Date.now()}`,
      topic,
      duration: durationSeconds,
      category,
      tone,
      title: `Discover ${topic}`,
      script: fullScript,
      description,
      hashtags,
      pinned_comment,
      alternativeTitles,
      word_count: fullScript.split(' ').length,
      keyPoints,
      created_at: new Date().toISOString(),
      is_series: false,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}
