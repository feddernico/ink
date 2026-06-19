# Change: Fix Mobile Textarea Zoom Issue

## Why
On mobile devices, tapping the textarea causes unwanted zoom because the font-size (14px) is below the 16px threshold that triggers automatic zoom on iOS Safari and other mobile browsers. This breaks the user experience and makes editing difficult.

## What Changes
- Increase textarea font-size to 16px on mobile devices
- Add media query targeting mobile viewports to apply appropriate font-size
- Maintain existing 14px font-size on desktop where zoom is not an issue

## Impact
- Affected specs: mobile-support
- Affected code: src/styles.scss
- Breaking changes: none (style-only improvement)

.
