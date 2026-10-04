# Re:Learn Design System

## Design Goal

Create a minimal, premium learner experience that feels like:

**Duolingo × Apple × LeetCode**

The product should feel intelligent without looking like an AI product.

Primary principle:

> Don't just solve the problem. Understand why.

---

## Design Principles

### 1. Jakob's Law

Use familiar interaction patterns.

- Standard navbar
- Familiar buttons
- Conventional navigation
- Predictable forms and controls
- No unnecessary novel interactions
- Users should understand the interface without learning the interface

### 2. Minimalism

Every element must have a purpose.

- Generous whitespace
- Few colors
- Short copy
- Strong hierarchy
- Avoid decorative UI
- Avoid excessive cards
- Avoid unnecessary icons

### 3. Premium Feel

Take visual cues from Apple.

- Large typography
- Excellent spacing
- Subtle borders
- Soft shadows
- Restrained animation
- High-quality typography
- Calm visual rhythm

### 4. Technical Credibility

Take cues from LeetCode.

- Clean code presentation
- Monospace typography for code
- Clear execution states
- Precise technical language
- Professional editor surfaces

### 5. Friendly Learning

Take cues from Duolingo.

- Encouraging feedback
- Visible progress
- Small achievable steps
- Positive reinforcement
- Mistakes should feel useful, not punitive

---

# Landing Page

## Navbar

Left:

**Re:Learn**

Center:

- Learn
- How it works
- Progress

Right:

- Sign in
- **Start learning**

Keep the navbar spacious and unobtrusive.

---

## Hero

Two-column layout.

### Left

Eyebrow:

`ADAPTIVE PROGRAMMING LEARNING`

Headline:

# Learn to think in code.

Subtitle:

> Understand your mistakes. Practice what you need. Build real mastery.

Buttons:

**Start learning**

See how it works

### Right

Show a realistic coding interaction.

```python
numbers = [10, 20, 30]
print(numbers[1])
Show:
✓ Code works
Then:
Let's check your reasoning.
Question:
Why does numbers[1] return 20?
This is the primary visual representation of Re:Learn.
Problem / Solution
Heading:
Wrong answer is only the beginning.
Two simple panels.
Traditional
❌ Wrong Answer

Expected: 20
Your output: 10

Try again.
Re:Learn
Let's figure out what happened.

Your code works, but your reasoning
may reveal a different mental model.

Let's check.
Keep the comparison extremely simple.
How It Works
Heading:
Learn through understanding.
Four horizontal steps:
01
Practice
02
Understand
03
Improve
04
Master
Use simple icons and minimal supporting text.
Do not expose machine-learning terminology.
Mastery
Heading:
Getting it right once isn't mastery.
Show:
✓ Solve
✓ Apply
✓ Explain
Then:
MASTERED
Use a restrained success animation.
No confetti.
No excessive gamification.
Final CTA
Centered.
Heading:
Ready to understand your code?
Button:
Start learning
Visual System
Colors
Primary background:
Warm off-white / near-white
Primary text:
Near-black
Secondary text:
Muted gray
Accent:
One restrained brand accent
Success:
Soft green
Warning:
Soft amber
Error:
Muted red
Do not use multiple bright accent colors.
Typography
Use a modern sans-serif.
Headings:


Large

Bold

Tight hierarchy

Short
Body:


Comfortable reading size

High contrast

Muted secondary text
Code:
Use a monospace font.
Spacing
Prioritize whitespace.
Use a consistent spacing scale.
Large sections should breathe.
Avoid tightly packed dashboards.
Cards
Use cards only when they improve grouping or hierarchy.
Cards should have:


subtle border

soft radius

minimal shadow

generous internal padding
Do not put every piece of content inside a card.
Buttons
Primary button:
Solid accent background.
Secondary button:
Transparent / subtle border.
Buttons should be:


clear

familiar

readable

consistent
Primary CTA throughout the landing page:
Start learning
Animation
Use subtle animation only for:


page transitions

hover states

progress

code execution

success/mastery states
Animation should communicate state, not decorate the page.
Keep transitions fast and smooth.
UX Rules


One primary action per screen.

Keep navigation predictable.

Never make users guess what is clickable.

Use familiar controls.

Keep copy short.

Show feedback immediately.

Never punish mistakes visually.

Do not overwhelm learners with information.

Hide technical system complexity.

Make the learner's progress obvious.
Re:Learn Product Personality
Re:Learn should feel:
Calm.
Intelligent.
Encouraging.
Precise.
Premium.
It should NOT feel:


childish

corporate

overly gamified

overly technical

like a chatbot

like an AI demo

like a generic SaaS dashboard
Core UX Story
Every important learning interaction should reinforce this loop:
Practice
   ↓
Make a mistake
   ↓
Understand why
   ↓
Practice again
   ↓
Apply somewhere new
   ↓
Explain the idea
   ↓
Mastery
The interface should make this feel natural.
The intelligence should be felt through the experience, not explained through technical UI.
Final Design Test
A new user should understand within 5 seconds:
What is this?
A programming learning platform.
Why is it different?
It helps you understand the reason behind your mistakes.
What should I do?
Start learning.
Primary CTA:
Start learning.