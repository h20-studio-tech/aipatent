Embodiment Navigation Feature
Problem
Users reviewing extracted embodiments cannot easily verify them against the source document. Currently, clicking an embodiment only scrolls to the page, not the specific text location.
Solution
Enable precise text navigation: clicking an embodiment scrolls to and highlights the exact source text.
User Flow

User clicks embodiment in right panel
Left panel scrolls to correct page and text position
Source text highlights briefly (3 seconds)
User sees embodiment in original context

Technical Context

Embodiment data includes: page_number, start_char, end_char
Character positions: Relative to page start (not document start)
Current state: Page navigation works; text navigation doesn't

Implementation Approach
Core Logic

Get page container using page_number
Walk text nodes counting characters to find start_char position
Create a range from start_char to end_char
Scroll to and highlight the range

Key Challenges

Character counting: Must match extraction logic exactly (whitespace, special chars)
React rendering: DOM might not be ready immediately after page navigation
Multi-node text: Target text might span multiple HTML elements

MVP Scope

Scroll to exact text location
Basic yellow highlight
Chrome only
No persistence across sessions