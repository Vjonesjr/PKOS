# Android Room migration boundary

This directory is migration source, **not part of the shipped Capacitor APK**. The current APK continues to use Base44 and device-scoped browser storage for preferences and focus recovery. It does not claim full Room offline support.

`RoomOutbox.kt` defines an owner-scoped Room cache, transactional cache/outbox writes, leased retries, conflict preservation, a WorkManager worker, and the transport contract for the Supabase RPCs. UI code must observe the Room DAO, not the network. Generate record and mutation UUIDs on the device. Keep a mutation ID unchanged for every retry. Use `expected_version` from the last accepted server record; preserve pending edits when pulling a newer canonical snapshot.

Integration still required: add the Room runtime/compiler and WorkManager dependencies using the Android project's supported Kotlin/KSP versions; provide an Application/WorkerFactory implementation of `SyncDependencies`; implement the user-JWT HTTP transport; bind ViewModels to DAO flows; route every mutation through the repository; handle conflict review; add Android instrumentation tests and process-death/network-loss tests. No service-role credential belongs in Android.

Install the two SQL migrations in a Supabase project first. `mvp_command` serializes and validates mutations, and `mvp_sync` returns complete per-user revisions with tombstones. Supabase project URL, publishable key, authentication, private storage policies and account deletion need deployment/configuration. Existing Base44 IDs/authentication require an explicit data migration; do not point this client at Supabase and expect existing accounts to transfer automatically.

Official references:
- https://developer.android.com/topic/architecture/data-layer/offline-first
- https://developer.android.com/training/data-storage/room
- https://developer.android.com/reference/androidx/work/CoroutineWorker
