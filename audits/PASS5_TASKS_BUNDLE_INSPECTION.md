# Pass 5 — Task screen inspection from available APK

Examined the bundled frontend JavaScript inside the provided Smart-PKOS-TEST-FIXED-20261031.apk. This is a reference build, not proof of the exact Pass 4 source.

## Observed behavior in bundled Tasks screen
- Tasks use category tabs: Today, Tomorrow, Upcoming, Next, Repeating, Waiting, Someday, Completed.
- Task display options in this build: Cards, Compact, List.
- Each selected category renders its matching task array directly with `.map(...)`, with no five-at-a-time presentation limit.
- Repeating tasks have a separate render path.
- Task data is fetched with a limit of 500, which is a fetch bound, not a screen presentation limit.

## Correct implementation direction
- Add five-at-a-time presentation pagination to the selected category results, not to database storage.
- Apply a separate five-at-a-time display rule to Repeating, preserving Pause/Resume/Edit series controls.
- Reset visible count when changing category, but preserve collapse preferences where applicable.
- Existing UI is tab-based, so do not invent duplicate Today/Upcoming/Someday group sections inside Tasks.
- Existing `TaskGroupPager` is a reusable component, not yet integrated.

## Evidence limitation
The inspected APK predates the exact Pass 4 rebuilt source. The Pass 5 ZIP-restored source must be inspected before applying line-specific code edits. No APK build or install was completed in this inspection.
